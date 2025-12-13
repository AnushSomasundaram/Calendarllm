import os
import sys
import json
import sqlite3
import io
import contextlib
from datetime import datetime

@contextlib.contextmanager
def suppress_stdout_stderr():
    """
    Temporarily redirect stdout and stderr so CrewAI's pretty boxes
    do NOT leak into Electron. We only print our own JSON manually.
    """
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()
        yield
    finally:
        sys.stdout = old_out
        sys.stderr = old_err


# Make sure we can import local modules (tools, crew, etc.)
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Also add the parent directory (src) so we can import 'calendar_interaction' as a package
# This is needed because crew.py does: from calendar_interaction.tools.sqlite_tool import sqlite_tool
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

# This registers the tool with CrewAI via the @tool decorator
import tools.sqlite_tool

from crew import CalendarInteractionCrew


def get_db_path() -> str:
    """
    Use CALENDAR_DB_PATH env var if provided.
    Otherwise default to 'calendar_llm.db' in current working directory.
    Electron sets CALENDAR_DB_PATH so we share the same DB file.
    """
    return os.getenv("CALENDAR_DB_PATH", "calendar_llm.db")


def load_openai_key_from_sqlite():
    """
    Load the OpenAI API key from the SQLite 'settings' table:
      key='openai_api_key'
    and set OPENAI_API_KEY in the environment so CrewAI/OpenAI client can use it.
    """
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key = 'openai_api_key'")
        row = cur.fetchone()
        conn.close()
    except Exception as e:
        # Send a JSON log line back to Electron
        print(json.dumps({
            "type": "log",
            "level": "error",
            "message": f"Error reading OpenAI key from DB: {e}"
        }), flush=True)
        return

    if row and row[0]:
        os.environ["OPENAI_API_KEY"] = row[0]
        print(json.dumps({
            "type": "log",
            "level": "info",
            "message": "Loaded OPENAI_API_KEY from SQLite settings"
        }), flush=True)
    else:
        print(json.dumps({
            "type": "log",
            "level": "warn",
            "message": "No openai_api_key found in settings table"
        }), flush=True)


def main():
    # 1. Load key
    load_openai_key_from_sqlite()

    # 2. Build the CrewAI pipeline
    calendar_crew = CalendarInteractionCrew().crew()

    # 3. Listen for JSON lines: { "id": <number>, "message": <string> }
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
            req_id = req.get("id")
            message = req.get("message", "")
        except Exception as e:
            err_resp = {
                "id": None,
                "reply": None,
                "error": f"Invalid JSON from Electron: {e}"
            }
            print(json.dumps(err_resp), flush=True)
            continue

        try:
            # Suppress CrewAI's pretty printing (boxes, tracing banners, etc.)
            with suppress_stdout_stderr():
                now = datetime.now()
                # Pass both user_input and user_query so any template is satisfied
                # AND inject current date context
                result = calendar_crew.kickoff(
                    inputs={
                        "user_input": message,
                        "user_query": message,
                        "current_date": now.strftime("%Y-%m-%d"),
                        "current_time": now.strftime("%H:%M"),
                        "current_year": str(now.year),
                    }
                )

            reply = result if isinstance(result, str) else str(result)
            resp = {"id": req_id, "reply": reply, "error": None}
        except Exception as e:
            resp = {"id": req_id, "reply": None, "error": str(e)}

        # This is the ONLY non-log thing we print: one JSON line for Electron
        print(json.dumps(resp), flush=True)


if __name__ == "__main__":
    main()