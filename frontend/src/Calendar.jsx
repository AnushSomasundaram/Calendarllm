import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from './EventModal';

// Centered container
const pageStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center", // Center vertically in the available space
  backgroundColor: "black",
  padding: "20px", // Add some padding around the calendar
  boxSizing: "border-box",
  overflow: "hidden", // Prevent scroll on the page wrapper
};

const containerStyle = {
  width: '100%',
  maxWidth: 1200,
  height: '100%', // Take full available height (minus padding)
  maxHeight: '90vh', // Limit height so it doesn't touch edges too much
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  boxSizing: 'border-box',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  background: '#fff',
  overflow: 'hidden',
};

const INITIAL_EVENTS = [];

export default function Calendar() {
  const [events, setEvents] = useState(INITIAL_EVENTS);

  // editor state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('add'); // 'add' | 'edit'
  const [defaultDate, setDefaultDate] = useState('');
  const [editing, setEditing] = useState(null);

  const idCounter = useRef(3);

  // 🔹 Load events from SQLite on mount + poll so LLM changes show up
  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      if (!window.calendarDB?.getEventsInRange) return;

      // wide range: 1 year back to 1 year forward
      const now = new Date();
      const start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      const end = new Date(now);
      end.setFullYear(now.getFullYear() + 1);

      try {
        const rows = await window.calendarDB.getEventsInRange(
          start.toISOString(),
          end.toISOString()
        );

        if (!isMounted) return;

        const mapped = rows.map(row => ({
          id: row.id.toString(),
          title: row.title,
          start: row.start_time,
          end: row.end_time,
          allDay: !!row.all_day,
          notes: row.description || "",
          extendedProps: {
            notes: row.description || "",
            location: row.location || "",
          },
        }));

        setEvents(mapped);
      } catch (err) {
        console.error("Failed to load events from DB:", err);
      }
    }

    // initial load
    loadEvents();

    // ✅ poll every 5 seconds so LLM changes are picked up
    const intervalId = setInterval(loadEvents, 1000);

    // cleanup on unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  function openAdd(dateStr = '') {
    setMode('add');
    setDefaultDate(dateStr);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(fcEvent) {
    const e = events.find(x => x.id === fcEvent.id);
    if (!e) return;
    setMode('edit');
    setEditing(e);
    setOpen(true);
  }

  function handleClose() { setOpen(false); }

  // 🔹 Add event: update React state + SQLite
  async function handleAdd(payload) {
    const { title, start, end, allDay, notes } = payload;

    // First, persist to DB if available
    let newId = String(idCounter.current++);

    if (window.calendarDB?.addEvent) {
      try {
        const dbEvent = {
          title,
          description: notes || "",
          start_time: start,          // ISO string
          end_time: end,              // ISO string
          all_day: allDay ? 1 : 0,
          location: "",               // you can hook this up later
        };
        const res = await window.calendarDB.addEvent(dbEvent);
        if (res && res.id != null) {
          newId = String(res.id);
        }
      } catch (err) {
        console.error("Failed to insert event into DB:", err);
      }
    }

    const evt = {
      id: newId,
      title,
      start,
      end,
      allDay,
      notes,
      extendedProps: {
        notes: notes || "",
      },
    };

    setEvents(prev => [...prev, evt]);
    setOpen(false);
  }

  // 🔹 Update event: React state + SQLite
  async function handleUpdate(updated) {
    const { id, title, start, end, allDay, notes } = updated;

    if (window.calendarDB?.updateEvent) {
      try {
        const dbEvent = {
          id: Number(id),
          title,
          description: notes || "",
          start_time: start,
          end_time: end,
          all_day: allDay ? 1 : 0,
          location: "",
        };
        await window.calendarDB.updateEvent(dbEvent);
      } catch (err) {
        console.error("Failed to update event in DB:", err);
      }
    }

    setEvents(prev =>
      prev.map(e =>
        e.id === id ? { ...e, title, start, end, allDay, notes } : e
      )
    );
    setOpen(false);
  }

  // 🔹 Delete event: React state + SQLite
  async function handleDelete(id) {
    if (window.calendarDB?.deleteEvent) {
      try {
        await window.calendarDB.deleteEvent(Number(id));
      } catch (err) {
        console.error("Failed to delete event from DB:", err);
      }
    }

    setEvents(prev => prev.filter(e => e.id !== id));
    setOpen(false);
  }

  // drag/resize sync + push change to DB
  async function handleEventChange(changeInfo) {
    const { id, start, end, extendedProps, title, allDay } = changeInfo.event;

    const newStart = start
      ? (allDay ? start.toISOString().slice(0, 10) : start.toISOString())
      : undefined;
    const newEnd = end
      ? (allDay ? end.toISOString().slice(0, 10) : end.toISOString())
      : undefined;

    setEvents(prev =>
      prev.map(evt =>
        evt.id === id
          ? {
            ...evt,
            start: newStart || evt.start,
            end: newEnd || evt.end,
            notes: extendedProps?.notes ?? evt.notes,
            title: title ?? evt.title,
            allDay: allDay ?? evt.allDay,
          }
          : evt
      )
    );

    // Also sync to DB if available
    if (window.calendarDB?.updateEvent) {
      try {
        const updatedEvt = events.find(e => e.id === id);
        const dbEvent = {
          id: Number(id),
          title: title ?? updatedEvt?.title ?? "",
          description: extendedProps?.notes ?? updatedEvt?.notes ?? "",
          start_time: newStart || updatedEvt?.start,
          end_time: newEnd || updatedEvt?.end,
          all_day: allDay ? 1 : 0,
          location: "",
        };
        await window.calendarDB.updateEvent(dbEvent);
      } catch (err) {
        console.error("Failed to sync drag/resize change to DB:", err);
      }
    }
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => openAdd('')} style={{ padding: '8px 12px' }}>
            ➕ Add Event
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="100%"
          expandRows={true}
          fixedWeekCount={true}
          editable={true}
          selectable={true}
          dayMaxEvents={true}
          dayMaxEventRows={3}
          eventTextColor="#111827"   // black text
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={events}
          dateClick={(info) => openAdd(info.dateStr)}
          eventClick={(info) => openEdit(info.event)}
          eventChange={handleEventChange}
        />
      </div>

      <EventModal
        isOpen={open}
        mode={mode}
        initialEvent={editing}
        defaultDate={defaultDate}
        onSave={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onClose={handleClose}
      />
    </div>
  );
}