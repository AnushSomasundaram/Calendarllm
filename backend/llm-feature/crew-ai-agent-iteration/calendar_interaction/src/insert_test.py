import os
import sys
import json

# 1. Ensure this src directory is on the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# 2. Import the Tools class from your sqlite_tool
from calendar_interaction.tools.sqlite_tool import Tools

# 3. Point the tool at your real calendar DB
os.environ["CALENDAR_DB_PATH"] = "../../development/calendar_llm/dev_data/calendar_llm.db"

def pretty(label, resp_json):
    print(f"\n=== {label} ===")
    try:
        data = json.loads(resp_json)
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"(Could not parse JSON: {e})")
        print(resp_json)

def main():
    tools = Tools()

    # A) Check what tables exist
    resp = tools.run_sql("SELECT name FROM sqlite_master WHERE type='table';")
    pretty("Tables in DB", resp)

    # B) Check schema of events table (if it exists)
    resp = tools.run_sql("PRAGMA table_info(events);")
    pretty("Schema of events table", resp)

    # C) Try inserting a test event
    # Adjust column names to *match your schema* from step B
    insert_sql = """
    INSERT INTO events (title, description, start_time, end_time, all_day, location)
    VALUES (
    'Manual test event from sqlite_tool',
    'Created via insert_test.py using sqlite_tool',
    '2025-12-11T11:00:00',
    '2025-12-11T12:00:00',
    0,
    ''
    );
    """
    resp = tools.run_sql(insert_sql)
    pretty("Insert result", resp)

    # D) Confirm the row is there
    resp = tools.run_sql("SELECT * FROM events ORDER BY rowid DESC LIMIT 5;")
    pretty("Last 5 events", resp)

if __name__ == "__main__":
    main()