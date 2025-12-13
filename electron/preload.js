// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("calendarDB", {
    // ----- Events -----
    getEventsInRange: (startIso, endIso) =>
        ipcRenderer.invoke("events:get-range", { start: startIso, end: endIso }),

    getAllEvents: () =>
        ipcRenderer.invoke("events:get-all"),

    addEvent: (event) =>
        ipcRenderer.invoke("events:add", event),

    updateEvent: (event) =>
        ipcRenderer.invoke("events:update", event),

    deleteEvent: (id) =>
        ipcRenderer.invoke("events:delete", id),

    // ----- Settings (OpenAI API key) -----
    getOpenAIKey: () =>
        ipcRenderer.invoke("settings:get-openai-key"),

    setOpenAIKey: (key) =>
        ipcRenderer.invoke("settings:set-openai-key", key),

    // ----- LLM Chat (CrewAI) ----- iter 2 -- additional
    // message: string → returns: reply string from Python CrewAI
    llmChat: (message) =>
        ipcRenderer.invoke("llm:chat", message),
});