import os
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from calendar_interaction.tools.sqlite_tool import sqlite_tool  # module-level tool function
from crewai import LLM

def default_llm():
    return LLM(
        model="gpt-4.1-mini",
        temperature=0.2,
        max_tokens=1024,
    )

@CrewBase
class CalendarInteractionCrew():
    """Calendar LLM crew for natural language → SQL → SQLite → response"""
    
    # Resolve paths relative to this file to work in both Dev and PyInstaller
    import sys
    if getattr(sys, 'frozen', False):
        # In PyInstaller bundle
        # The --add-data "config:calendar_interaction/config" puts it in sys._MEIPASS/calendar_interaction/config
        base_path = os.path.join(sys._MEIPASS, 'calendar_interaction')
    else:
        # In Development
        base_path = os.path.dirname(__file__)

    agents_config = os.path.join(base_path, 'config/agents.yaml')
    tasks_config  = os.path.join(base_path, 'config/tasks.yaml')

    # ---------- AGENTS ----------

    @agent
    def nl_agent(self) -> Agent:
        """Understands natural language and extracts structured intent."""
        return Agent(
            config=self.agents_config['nl_agent'],
            verbose=True,
        )

    @agent
    def sql_generator_agent(self) -> Agent:
        """Turns interpreted intent into a single SQL statement (or none)."""
        return Agent(
            config=self.agents_config['sql_generator_agent'],
            verbose=True,
        )

    @agent
    def sql_executor_agent(self) -> Agent:
        """Executes SQL on the SQLite calendar DB via the sqlite_tool."""
        return Agent(
            config=self.agents_config['sql_executor_agent'],
            tools=[sqlite_tool],   # <-- explicitly attach the tool object
            verbose=True,
        )

    @agent
    def responder_agent(self) -> Agent:
        """Produces the final, human-friendly response to the user."""
        return Agent(
            config=self.agents_config['responder_agent'],
            verbose=True,
        )

    # ---------- TASKS ----------

    @task
    def interpret_user_query(self) -> Task:
        """NLU: figure out intent + fields from the user_query."""
        return Task(
            config=self.tasks_config['interpret_user_query'],
        )

    @task
    def plan_sql_for_intent(self) -> Task:
        """Planner: take intent/fields and produce SQL (or none)."""
        return Task(
            config=self.tasks_config['plan_sql_for_intent'],
        )

    @task
    def execute_sql(self) -> Task:
        """Executor: run the SQL using sqlite_tool and return results."""
        return Task(
            config=self.tasks_config['execute_sql'],
        )

    @task
    def respond_to_user(self) -> Task:
        """Responder: turn everything into a final user-facing reply."""
        return Task(
            config=self.tasks_config['respond_to_user'],
        )

    # ---------- CREW ----------

    @crew
    def crew(self) -> Crew:
        """Creates the CalendarInteraction crew with a 4-step sequential pipeline."""
        return Crew(
            agents=self.agents,  # Automatically created from @agent methods
            tasks=self.tasks,    # Automatically created from @task methods, in this file's order
            process=Process.sequential,
            verbose=True,
            tracing=True,
        )
