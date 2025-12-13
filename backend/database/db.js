// backend/database/db.js
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { app } = require("electron");

let db = null;

/**
 * Open (or create) the SQLite database in the user's app data folder.
 */
function initDatabase() {
  if (db) return db;

  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "calendar_llm.db");

  // 🔹 Ensure the directory exists (needed for dev_data/ etc.)
  fs.mkdirSync(userDataPath, { recursive: true });

  console.log("Using SQLite DB at:", dbPath);

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL"); // better concurrency/durability

  createTables();
  return db;
}

/**
 * Create tables if they don't exist.
 */
function createTables() {
  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      start_time  TEXT NOT NULL, -- ISO 8601 string
      end_time    TEXT NOT NULL, -- ISO 8601 string
      all_day     INTEGER NOT NULL DEFAULT 0,
      location    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Settings table (for OpenAI API key etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

/* ---------- EVENTS API ---------- */

function getEventsInRange(startIso, endIso) {
  const stmt = db.prepare(`
    SELECT *
    FROM events
    WHERE start_time < @end
      AND end_time   > @start
    ORDER BY start_time ASC
  `);
  return stmt.all({ start: startIso, end: endIso });
}

function getAllEvents() {
  const stmt = db.prepare(`
    SELECT *
    FROM events
    ORDER BY start_time ASC
  `);
  return stmt.all();
}

function insertEvent(event) {
  const stmt = db.prepare(`
    INSERT INTO events (title, description, start_time, end_time, all_day, location)
    VALUES (@title, @description, @start_time, @end_time, @all_day, @location)
  `);
  const info = stmt.run({
    title: event.title,
    description: event.description ?? null,
    start_time: event.start_time,
    end_time: event.end_time,
    all_day: event.all_day ? 1 : 0,
    location: event.location ?? null,
  });
  return info.lastInsertRowid;
}

function updateEvent(event) {
  const stmt = db.prepare(`
    UPDATE events
    SET title       = @title,
        description = @description,
        start_time  = @start_time,
        end_time    = @end_time,
        all_day     = @all_day,
        location    = @location,
        updated_at  = datetime('now')
    WHERE id = @id
  `);
  stmt.run({
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    start_time: event.start_time,
    end_time: event.end_time,
    all_day: event.all_day ? 1 : 0,
    location: event.location ?? null,
  });
}

function deleteEvent(id) {
  const stmt = db.prepare(`DELETE FROM events WHERE id = ?`);
  stmt.run(id);
}

/* ---------- SETTINGS API (OpenAI key) ---------- */

function getOpenAIKey() {
  const stmt = db.prepare(
    `SELECT value FROM settings WHERE key = 'openai_api_key'`
  );
  const row = stmt.get();
  return row ? row.value : null;
}

function setOpenAIKey(key) {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES ('openai_api_key', @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run({ value: key });
}

module.exports = {
  initDatabase,
  getEventsInRange,
  getAllEvents,
  insertEvent,
  updateEvent,
  deleteEvent,
  getOpenAIKey,
  setOpenAIKey,
};