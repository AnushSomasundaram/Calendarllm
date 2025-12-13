# backend/llm-feature/langchain_calendar.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, List

from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from db_client import (
    DB_PATH,
    read_openai_key_from_db,
    insert_event,
    get_all_events,
)

# ---------- LLM helper ----------

def get_llm() -> ChatOpenAI:
    """
    Returns a ChatOpenAI instance using the API key stored in SQLite.
    """
    api_key = read_openai_key_from_db()
    if not api_key:
        raise RuntimeError("No OpenAI API key found in SQLite 'settings' table.")
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1,
        api_key=api_key,
    )


# ---------- NL → event JSON ----------

def parse_nl_to_event(
    user_text: str,
    reference_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Use the LLM to convert a natural-language request into an event JSON
    with fields:
      - title (str)
      - description (str)
      - date (YYYY-MM-DD)
      - start_time ('HH:MM' or null)
      - end_time ('HH:MM' or null)
      - all_day (bool)
      - location (str)
    """
    if reference_date is None:
        reference_date = datetime.now()

    llm = get_llm()
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "You are a helpful assistant that converts natural language "
                    "calendar requests into a JSON event description.\n"
                    "Today is {today}.\n"
                    "If the user mentions relative dates like 'tomorrow' or "
                    "'next Monday', resolve them to a concrete calendar date.\n"
                    "Respond with ONLY valid JSON, no extra text."
                ),
            ),
            (
                "user",
                (
                    "User request: {user_text}\n\n"
                    "Return a JSON object with the following keys:\n"
                    "- title (string)\n"
                    "- description (string)\n"
                    "- date (string, 'YYYY-MM-DD')\n"
                    "- start_time (string, 'HH:MM' 24-hour or null)\n"
                    "- end_time (string, 'HH:MM' 24-hour or null)\n"
                    "- all_day (boolean)\n"
                    "- location (string)\n\n"
                    "Rules:\n"
                    "- date must be in 'YYYY-MM-DD' format.\n"
                    "- start_time and end_time must be 'HH:MM' 24-hour format, "
                    "  or null if all_day is true.\n"
                    "- If no time is given but it's not clearly all-day, you may "
                    "  choose a reasonable time (e.g. 09:00–10:00)."
                ),
            ),
        ]
    )

    chain = prompt | llm | parser

    result = chain.invoke(
        {
            "today": reference_date.strftime("%Y-%m-%d"),
            "user_text": user_text,
        }
    )
    return result


def nl_to_event_and_insert(user_text: str) -> Dict[str, Any]:
    """
    Parse the user's request into an event, then insert it into SQLite.
    Returns the full DB row as a dict.
    """
    parsed = parse_nl_to_event(user_text)

    date_str = parsed["date"]            # 'YYYY-MM-DD'
    start_time = parsed.get("start_time")
    end_time = parsed.get("end_time")
    all_day = bool(parsed.get("all_day", False))

    if all_day:
        start_iso = f"{date_str}T00:00:00"
        end_iso = f"{date_str}T23:59:59"
    else:
        start_iso = f"{date_str}T{start_time}:00"
        end_iso = f"{date_str}T{end_time}:00"

    event_row = {
        "title": parsed["title"],
        "description": parsed.get("description") or "",
        "start_time": start_iso,
        "end_time": end_iso,
        "all_day": all_day,
        "location": parsed.get("location") or "",
    }

    event_id = insert_event(event_row)
    event_row["id"] = event_id
    return event_row


# ---------- SQL agent for calendar questions ----------

def get_sql_db() -> SQLDatabase:
    """
    Wrap the SQLite DB so LangChain's SQL agent can query it.
    """
    return SQLDatabase.from_uri(f"sqlite:///{DB_PATH}")


def answer_calendar_question(question: str) -> str:
    """
    Use a SQL agent (LLM + SQLDatabase) to answer questions about events.
    Example questions:
      - 'What did I do yesterday?'
      - 'What events do I have on 2025-12-17?'
      - 'How many meetings do I have next week?'
    """
    llm = get_llm()
    db = get_sql_db()

    agent = create_sql_agent(
        llm=llm,
        db=db,
        verbose=False,   # keep logs out of the final answer
    )

    # agent.run / agent.invoke returns a string answer
    answer = agent.invoke({"input": question})
    return answer


# ---------- Quick CLI test ----------

if __name__ == "__main__":
    print("DB_PATH:", DB_PATH)

    # Example: schedule something
    text = "Lunch with Jake tomorrow at 1pm in Hoboken to talk about the project."
    evt = nl_to_event_and_insert(text)
    print("Created event:", evt)

    # Example: query
    q = "What events do I have tomorrow?"
    ans = answer_calendar_question(q)
    print("Q:", q)
    print("A:", ans)