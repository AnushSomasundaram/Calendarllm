#!/bin/bash
set -e

# Environment Setup
ENV_PYTHON="/Users/software/anaconda3/envs/calendar-llm/bin/python"
PYINSTALLER="/Users/software/anaconda3/envs/calendar-llm/bin/pyinstaller"

# Ensure PyInstaller is installed
echo "Checking for PyInstaller..."
"$ENV_PYTHON" -m pip install pyinstaller

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf backend/dist backend/build

# Build
echo "Building Python executable..."

# We need to make sure the 'tools' module is found.
# crewai_runner.py imports 'tools.sqlite_tool'.
# 'tools' is inside 'calendar_interaction'.
# So we need 'calendar_interaction' directory in the PYTHONPATH during analysis.

BASE_DIR="backend/llm-feature/crew-ai-agent-iteration/calendar_interaction/src"
INNER_DIR="$BASE_DIR/calendar_interaction"

"$PYINSTALLER" --noconfirm --onedir --console --clean \
    --name crewai_runner \
    --distpath backend/dist \
    --workpath backend/build \
    --paths "$BASE_DIR" \
    --paths "$INNER_DIR" \
    --hidden-import="tools" \
    --hidden-import="tools.sqlite_tool" \
    --add-data "$INNER_DIR/config:calendar_interaction/config" \
    --collect-all "crewai" \
    "$INNER_DIR/crewai_runner.py"

echo "Build complete. Executable at backend/dist/crewai_runner/crewai_runner"
