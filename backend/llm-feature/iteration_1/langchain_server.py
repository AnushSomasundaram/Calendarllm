# backend/llm-feature/langchain_server.py
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uvicorn

# Use your existing integration module
from langchain_integration import (
    nl_to_event_and_insert,
    answer_calendar_question,
    get_llm,
)

from db_client import DB_PATH


# ---------- FastAPI app ----------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # dev-friendly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


# ---------- Local helper: delete events on a date ----------

def delete_events_on_date(date_str: str) -> int:
    """
    Delete events whose start_time falls on the given YYYY-MM-DD date.
    Returns the number of rows deleted.

    Uses DB_PATH from db_client and sqlite3 directly,
    so we don't have to change db_client.py.
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Assumes start_time is stored like 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SS'
    cur.execute(
        "DELETE FROM events WHERE date(start_time) = date(?)",
        (date_str,),
    )
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted


# ---------- Small helper: intent classification ----------

def classify_intent(message: str) -> str:
    """
    Let the LLM decide what the user wants.

    Returns exactly one of:
      - 'schedule'  (create/add a new event)
      - 'query'     (answer questions about existing events)
      - 'delete'    (remove events)
      - 'other'
    """
    llm = get_llm()

    prompt = (
        "You are an intent classifier for a calendar assistant.\n"
        "Decide what the user wants to do and answer with ONE SINGLE WORD\n"
        "from this list:\n"
        "  schedule, query, delete, other\n\n"
        "Definitions:\n"
        "- schedule: add or create a new event, meeting, reminder, or block of time.\n"
        "- query: answer questions about existing events "
        "(what/when/where/how many, recap of a day, etc.).\n"
        "- delete: remove/cancel/delete/clear existing events.\n"
        "- other: anything else.\n\n"
        "Examples:\n"
        "- 'what do I have next week?' -> query\n"
        "- 'schedule lunch with Jake tomorrow at 1pm' -> schedule\n"
        "- 'remove all events on the 7th' -> delete\n"
        "- 'cancel my 3pm meeting tomorrow' -> delete\n\n"
        f"User message: {message}\n\n"
        "Intent:"
    )

    resp = llm.invoke(prompt)
    token = resp.content.strip().split()[0].lower().strip(" .,:;!?")
    if token not in {"schedule", "query", "delete", "other"}:
        token = "other"
    return token


# ---------- Small helper: extract a date for delete ----------

def extract_delete_date(message: str) -> str | None:
    """
    Ask the LLM to resolve the natural-language request into a single calendar date.

    Returns:
      - 'YYYY-MM-DD' if it can figure out a specific date
      - None otherwise
    """
    llm = get_llm()

    prompt = (
        "You are helping a calendar app understand which date to target for a delete.\n"
        "User message:\n"
        f"{message}\n\n"
        "Today is in the user's current timezone.\n"
        "Resolve relative phrases like 'today', 'tomorrow', 'on the 7th', "
        "'next Friday' into a concrete calendar date.\n\n"
        "Respond with ONLY one thing:\n"
        "- either a single date in the format YYYY-MM-DD\n"
        "- or the word NONE if you cannot determine a specific date.\n"
    )

    resp = llm.invoke(prompt)
    text = resp.content.strip()
    text = text.replace(" ", "")
    if text.upper().startswith("NONE"):
        return None
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return text[:10]
    return None


# ---------- Main chat endpoint ----------

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    msg = (req.message or "").strip()
    if not msg:
        return ChatResponse(
            reply=(
                "Tell me what you’d like to do with your calendar. "
                "For example: 'schedule lunch tomorrow at 1pm' or "
                "'what did I do last Friday?'."
            )
        )

    intent = classify_intent(msg)
    print(f"[calendar_llm] intent={intent!r} message={msg!r}")

    # ---- SCHEDULE: create event ----
    if intent == "schedule":
        try:
            evt = nl_to_event_and_insert(msg)

            title = evt.get("title", "Untitled")
            start = evt.get("start_time", "unknown start")
            end = evt.get("end_time", "unknown end")
            location = evt.get("location") or ""
            description = evt.get("description") or ""

            lines = [
                f"Got it — I’ve added **{title}** to your calendar. ✅",
                "",
                f"• Start: {start}",
                f"• End:   {end}",
            ]
            if location:
                lines.append(f"• Location: {location}")
            if description:
                lines.append(f"• Notes: {description}")
            lines.append("")
            lines.append("You should see it in your calendar now.")

            return ChatResponse(reply="\n".join(lines))
        except Exception as e:
            print("[calendar_llm] schedule error:", e)
            return ChatResponse(
                reply=(
                    "I tried to schedule that but ran into an internal error. "
                    "Make sure your OpenAI API key is set, then try again."
                )
            )

    # ---- QUERY: answer questions about events ----
    if intent == "query":
        try:
            ans = answer_calendar_question(msg)
            if not ans.strip():
                return ChatResponse(
                    reply="I checked your calendar but didn’t find anything that matches that."
                )
            return ChatResponse(reply=ans)
        except Exception as e:
            print("[calendar_llm] query error:", e)
            return ChatResponse(
                reply="I tried to look that up but something went wrong on my side. Try rephrasing the question."
            )

    # ---- DELETE: remove events ----
    if intent == "delete":
        try:
            date_str = extract_delete_date(msg)
            if not date_str:
                return ChatResponse(
                    reply=(
                        "It sounds like you want to remove some events, "
                        "but I couldn’t figure out exactly which date. "
                        "Try something like 'remove all events on December 7th'."
                    )
                )

            deleted = delete_events_on_date(date_str)
            if deleted == 0:
                return ChatResponse(
                    reply=f"I looked at {date_str}, but there were no events to delete."
                )
            elif deleted == 1:
                return ChatResponse(
                    reply=f"Done — I removed 1 event on {date_str}."
                )
            else:
                return ChatResponse(
                    reply=f"Done — I removed {deleted} events on {date_str}."
                )
        except Exception as e:
            print("[calendar_llm] delete error:", e)
            return ChatResponse(
                reply=(
                    "I understood that you want to delete events, "
                    "but I hit an error while trying to modify the calendar. "
                    "Try again in a moment or with a simpler request."
                )
            )

    # ---- OTHER: fall back to query style, but conversational ----
    try:
        ans = answer_calendar_question(msg)
        ans = ans.strip()
        if ans:
            return ChatResponse(reply=ans)
        else:
            return ChatResponse(
                reply=(
                    "I’m not totally sure what you wanted, but I tried treating it as "
                    "a question about your calendar and didn’t find anything obvious.\n\n"
                    "You can say things like:\n"
                    "- 'What did I do yesterday?'\n"
                    "- 'What do I have next week?'\n"
                    "- 'Schedule dinner with Sam tomorrow at 8pm.'"
                )
            )
    except Exception as e:
        print("[calendar_llm] other/fallback error:", e)
        return ChatResponse(
            reply=(
                "I couldn’t interpret that as a question or scheduling request without errors. "
                "Try a more specific ask about your calendar."
            )
        )


# ---------- Entry point ----------

if __name__ == "__main__":
    print("Using DB at:", DB_PATH)
    uvicorn.run(app, host="127.0.0.1", port=8000)

