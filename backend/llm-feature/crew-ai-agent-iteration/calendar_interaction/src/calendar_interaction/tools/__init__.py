# calendar_interaction/src/calendar_interaction/tools/__init__.py

from .sqlite_tool import Tools as SQLiteTools

class Tools(
    SQLiteTools,
):
    """
    Aggregate Tools class for CrewAI project.

    CrewAI will scan this class for @tool-decorated methods and
    register them by name (e.g., 'sqlite_tool').
    """
    pass