import os
import sqlite3
import json

# CrewAI's @tool decorator (fallback for local testing)
try:
    from crewai.tools import tool
except Exception:
    def tool(*args, **kwargs):
        def decorator(fn):
            return fn
        return decorator


# ============================================================
# 1. CORE SQL EXECUTION LOGIC (shared by everything)
# ============================================================

def _run_sql(sql: str) -> str:
    """
    Core SQL execution logic used by BOTH Crew (via sqlite_tool)
    and your manual tests (via Tools.run_sql).
    """
    print("[SQLITE_TOOL] CALLED with SQL:")
    print(sql)

    db_path = os.getenv("CALENDAR_DB_PATH")
    print(f"[SQLITE_TOOL] CALENDAR_DB_PATH = {db_path}")

    if not db_path:
        result = {
            "success": False,
            "sql": sql,
            "error": "CALENDAR_DB_PATH environment variable is not set.",
        }
        print(f"[SQLITE_TOOL] RESULT: {result}")
        return json.dumps(result)

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute(sql)

        is_select = sql.strip().upper().startswith("SELECT")
        rows = []
        rows_affected = 0

        if is_select:
            fetched = cur.fetchall()
            rows = [dict(r) for r in fetched]
        else:
            conn.commit()
            rows_affected = cur.rowcount

        conn.close()

        result = {
            "success": True,
            "sql": sql,
            "rows": rows,
            "rows_affected": rows_affected,
        }
        print(f"[SQLITE_TOOL] RESULT: {result}")
        return json.dumps(result, default=str)

    except Exception as e:
        result = {
            "success": False,
            "sql": sql,
            "error": str(e),
        }
        print(f"[SQLITE_TOOL] RESULT: {result}")
        return json.dumps(result)


# ============================================================
# 2. MODULE-LEVEL TOOL FUNCTION FOR CREW AI  (IMPORTANT PART)
# ============================================================

@tool("sqlite_tool")
def sqlite_tool(sql: str) -> str:
    """
    This is the CrewAI tool. CrewAI looks for this function name.
    The name must match what you list in agents.yaml:
        tools:
          - sqlite_tool
    """
    return _run_sql(sql)


# ============================================================
# 3. CLASS FOR MANUAL TESTING (e.g., insert_test.py)
# ============================================================

class Tools:
    """Convenience wrapper for manual Python tests."""
    def run_sql(self, sql: str) -> str:
        return _run_sql(sql)