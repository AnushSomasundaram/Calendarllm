from pathlib import Path
import sqlite3
from typing import List, Dict, Any, Optional

# This file is at: backend/llm-feature/db_client.py
# parents[0] -> "backend/llm-feature"
# parents[1] -> "backend"
# parents[2] -> "calendar_llm"  (project root)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = PROJECT_ROOT / "dev_data" / "calendar_llm.db"


def get_connection():
    """Create a sqlite3 connection to the Electron DB."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def read_openai_key_from_db():
    """
    Read the OpenAI API key from the SQLite 'settings' table.
    Returns the key string, or None if not found.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT value FROM settings WHERE key = 'openai_api_key';"
    )
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None
def get_openai_key() -> Optional[str]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT value FROM settings WHERE key = 'openai_api_key' LIMIT 1;"
    )
    row = cur.fetchone()
    conn.close()
    return row["value"] if row else None


def get_all_events() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM events ORDER BY start_time ASC;")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_events_between(start_iso: str, end_iso: str) -> List[Dict[str, Any]]:
    """
    Return all events that overlap [start_iso, end_iso).
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT *
        FROM events
        WHERE start_time < ?
          AND end_time   > ?
        ORDER BY start_time ASC;
        """,
        (end_iso, start_iso),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def insert_event(event: Dict[str, Any]) -> int:
    """
    event keys: title, description, start_time, end_time, all_day, location
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO events (title, description, start_time, end_time, all_day, location)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            event.get("title"),
            event.get("description", "") or "",
            event.get("start_time"),
            event.get("end_time"),
            1 if event.get("all_day") else 0,
            event.get("location", "") or "",
        ),
    )
    eid = cur.lastrowid
    conn.commit()
    conn.close()
    return eid


if __name__ == "__main__":
    print("PROJECT_ROOT:", PROJECT_ROOT)
    print("DB_PATH:", DB_PATH)

    try:
        print("OpenAI key:", get_openai_key())
    except Exception as e:
        print("Error reading OpenAI key:", e)

    try:
        events = get_all_events()
        print(f"Loaded {len(events)} events")
        for ev in events:
            print(ev)
    except Exception as e:
        print("Error reading events:", e)