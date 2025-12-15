// // electron/main.js
// const { app, BrowserWindow, ipcMain } = require("electron");
// const path = require("path");

// // SQLite wrapper
// const db = require("../backend/database/db");

// // If you want dev vs prod behavior later
// const isDev = !app.isPackaged;

// let mainWindow = null;

// function createWindow() {
//     mainWindow = new BrowserWindow({
//         width: 1200,
//         height: 900,
//         backgroundColor: "#000000",
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),
//             contextIsolation: true,
//             nodeIntegration: false,
//         },
//     });

//     if (isDev) {
//         // Vite dev server
//         mainWindow.loadURL("http://localhost:5173");
//         mainWindow.webContents.openDevTools({ mode: "detach" });
//     } else {
//         // Later when you build the frontend
//         mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
//     }

//     mainWindow.on("closed", () => {
//         mainWindow = null;
//     });
// }

// app.whenReady().then(() => {
//     if (isDev) {
//         // 🔹 In dev, store all app data (including SQLite DB) inside ./dev_data
//         const devDataPath = path.join(process.cwd(), "dev_data");
//         app.setPath("userData", devDataPath);
//         console.log("DEV userData path:", devDataPath);
//     }

//     // Initialize SQLite DB once at startup
//     db.initDatabase();

//     createWindow();

//     app.on("activate", () => {
//         if (BrowserWindow.getAllWindows().length === 0) {
//             createWindow();
//         }
//     });
// });

// // Quit on all windows closed (except macOS)
// app.on("window-all-closed", () => {
//     if (process.platform !== "darwin") {
//         app.quit();
//     }
// });

// /* ===================== IPC HANDLERS ===================== */
// /* --------- Events --------- */

// // Get events in a time range (start/end are ISO strings)
// ipcMain.handle("events:get-range", (event, { start, end }) => {
//     return db.getEventsInRange(start, end);
// });

// // Add event
// // payload: { title, description, start_time, end_time, all_day, location }
// ipcMain.handle("events:add", (event, payload) => {
//     const id = db.insertEvent(payload);
//     return { id };
// });

// // Update event
// // payload must include id
// ipcMain.handle("events:update", (event, payload) => {
//     db.updateEvent(payload);
//     return { ok: true };
// });

// // Delete event
// ipcMain.handle("events:delete", (event, id) => {
//     db.deleteEvent(id);
//     return { ok: true };
// });

// // Get ALL events (for initial load)
// ipcMain.handle("events:get-all", () => {
//     return db.getAllEvents();
// });

// /* --------- Settings (OpenAI API key) --------- */

// ipcMain.handle("settings:get-openai-key", () => {
//     return db.getOpenAIKey();
// });

// ipcMain.handle("settings:set-openai-key", (event, key) => {
//     db.setOpenAIKey(key);
//     return { ok: true };
// });

// electron/main.js with crew ai
// electron/main.js with crew ai

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// SQLite wrapper
const db = require("../backend/database/db");

// If you want dev vs prod behavior later
const isDev = !app.isPackaged;

let mainWindow = null;

// Python process + LLM request tracking
let pythonProc = null;
let nextRequestId = 1;
const pendingLLMRequests = new Map(); // id -> { resolve, reject }

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        backgroundColor: "#000000",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        // Vite dev server
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools({ mode: "detach" });
    } else {
        // Built frontend
        mainWindow.loadFile(path.join(__dirname, "..", "dist_renderer", "index.html"));
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// Top-level variables for Python config
let pythonExecutable;
let scriptArgs = [];

function determinePythonPath() {
    if (app.isPackaged) {
        // Production: bundled executable
        const backendPath = path.join(process.resourcesPath, "backend");
        const exePath = path.join(backendPath, "crewai_runner");

        pythonExecutable = exePath;
        scriptArgs = [];
        console.log("PROD: Using bundled Python at:", pythonExecutable);
    } else {
        // Development: conda env
        pythonExecutable = "/Users/software/anaconda3/envs/calendar-llm/bin/python";
        scriptArgs = [
            "/Users/software/development/calendar_llm/backend/llm-feature/crew-ai-agent-iteration/calendar_interaction/src/calendar_interaction/crewai_runner.py",
        ];
        console.log("DEV: Using local Python at:", pythonExecutable);
    }
}

function startPythonBackend() {
    if (pythonProc) {
        console.log("Python backend already running.");
        return;
    }

    determinePythonPath();

    // Re-read DB path just in case
    // Note: app.getPath might fail if called before app is ready, but this is called from whenReady or IPC
    // Ideally we assume app is ready if this is called.
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "calendar_llm.db");

    console.log("Starting Python backend...");
    pythonProc = spawn(
        pythonExecutable,
        scriptArgs,
        {
            cwd: process.cwd(),
            env: {
                ...process.env,
                CALENDAR_DB_PATH: dbPath,
            },
        }
    );

    pythonProc.stdout.on("data", (data) => {
        const text = data.toString();
        text.split(/\r?\n/).forEach((line) => {
            line = line.trim();
            if (!line) return;

            if (!line.startsWith("{") || !line.endsWith("}")) {
                console.log("[PYTHON NON-JSON]", line);
                return;
            }

            let msg;
            try {
                msg = JSON.parse(line);
            } catch (e) {
                return;
            }

            if (msg.type === "log") {
                const level = msg.level || "log";
                const logFn = level === "error" ? console.error : console.log;
                logFn("[PYTHON LOG]", msg.message);
                return;
            }

            const { id, reply, error } = msg;
            const pending = pendingLLMRequests.get(id);

            if (!pending) return;

            pendingLLMRequests.delete(id);
            if (error) {
                pending.reject(new Error(error));
            } else {
                pending.resolve(reply);
            }
        });
    });

    pythonProc.stderr.on("data", (data) => {
        console.error("[PYTHON STDERR]", data.toString());
    });

    pythonProc.on("close", (code) => {
        console.log("Python process exited with code:", code);
        pythonProc = null;
    });
}

app.whenReady().then(() => {
    if (isDev) {
        // In dev, store all app data (including SQLite DB) inside ./dev_data
        const devDataPath = path.join(process.cwd(), "dev_data");
        app.setPath("userData", devDataPath);
        console.log("DEV userData path:", devDataPath);
    }

    // Initialize SQLite DB once at startup
    db.initDatabase();

    // Compute the DB path for Python (same as Node uses)
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "calendar_llm.db");
    console.log("LLM SQLite DB path for Python:", dbPath);

    // Start it up calling the top-level function
    startPythonBackend();

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit on all windows closed (except macOS)
app.on("window-all-closed", () => {
    // Cleanly shut down Python when app exits
    if (pythonProc) {
        try {
            pythonProc.kill();
        } catch (e) {
            console.error("Error killing Python process:", e);
        }
        pythonProc = null;
    }

    if (process.platform !== "darwin") {
        app.quit();
    }
});

/* ===================== IPC HANDLERS ===================== */
/* --------- Events --------- */

// Get events in a time range (start/end are ISO strings)
// Get events in a time range (start/end are ISO strings)
ipcMain.handle("events:get-range", (event, { start, end }) => {
    console.log(`[IPC] events:get-range start=${start} end=${end}`);
    const rows = db.getEventsInRange(start, end);
    console.log(`[IPC] events:get-range returning ${rows.length} rows`);
    return rows;
});

// Add event
// payload: { title, description, start_time, end_time, all_day, location }
ipcMain.handle("events:add", (event, payload) => {
    const id = db.insertEvent(payload);
    return { id };
});

// Update event
// payload must include id
ipcMain.handle("events:update", (event, payload) => {
    db.updateEvent(payload);
    return { ok: true };
});

// Delete event
ipcMain.handle("events:delete", (event, id) => {
    db.deleteEvent(id);
    return { ok: true };
});

// Get ALL events (for initial load)
ipcMain.handle("events:get-all", () => {
    return db.getAllEvents();
});

/* --------- Settings (OpenAI API key) --------- */

ipcMain.handle("settings:get-openai-key", () => {
    return db.getOpenAIKey();
});

ipcMain.handle("settings:set-openai-key", (event, key) => {
    db.setOpenAIKey(key);
    console.log("API Key updated. Restarting Python backend...");

    if (pythonProc) {
        pythonProc.kill();
        pythonProc = null;
    }

    // Give it a moment to die cleanly, then restart
    setTimeout(() => {
        startPythonBackend();
    }, 500);

    return { ok: true };
});

/* --------- LLM Chat (CrewAI) --------- */
// message: string, returns: reply string from Python CrewAI
ipcMain.handle("llm:chat", async (event, message) => {
    if (!pythonProc) {
        throw new Error("Python LLM backend is not running.");
    }

    const id = nextRequestId++;
    const payload = { id, message };

    return new Promise((resolve, reject) => {
        pendingLLMRequests.set(id, { resolve, reject });

        try {
            pythonProc.stdin.write(JSON.stringify(payload) + "\n");
        } catch (e) {
            pendingLLMRequests.delete(id);
            reject(e);
        }
    });
});