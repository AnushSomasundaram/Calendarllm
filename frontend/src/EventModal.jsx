import React, { useEffect, useState } from 'react';

export default function EventModal({
  isOpen,
  mode = 'add',            // 'add' | 'edit'
  initialEvent = null,     // { id, title, notes, start, end, allDay }
  defaultDate = '',
  onSave,                  // (payload) => void   for add
  onUpdate,                // (payload) => void   for edit
  onDelete,                // (id) => void        for edit
  onClose,
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(defaultDate || '');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState(defaultDate || '');
  const [endTime, setEndTime] = useState('');

  // helper -> split to local date/time strings
  const toLocalParts = (val) => {
    if (!val) return { date: '', time: '' };
    if (typeof val === 'string' && !val.includes('T')) return { date: val, time: '' };
    const d = val instanceof Date ? val : new Date(val);
    if (Number.isNaN(d.getTime())) return { date: '', time: '' };
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  };

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialEvent) {
      setTitle(initialEvent.title || '');
      setNotes(initialEvent.notes || '');
      const looksAllDay =
        initialEvent.allDay === true ||
        (typeof initialEvent.start === 'string' && !initialEvent.start.includes('T'));
      if (looksAllDay) {
        const s = toLocalParts(initialEvent.start);
        const e = toLocalParts(initialEvent.end || initialEvent.start);
        setStartDate(s.date); setStartTime('');
        setEndDate(e.date || s.date); setEndTime('');
      } else {
        const s = toLocalParts(initialEvent.start);
        const e = toLocalParts(initialEvent.end);
        setStartDate(s.date); setStartTime(s.time);
        setEndDate(e.date || s.date); setEndTime(e.time || '');
      }
    } else {
      setTitle(''); setNotes('');
      setStartDate(defaultDate || ''); setStartTime('');
      setEndDate(defaultDate || ''); setEndTime('');
    }
  }, [isOpen, mode, initialEvent, defaultDate]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter a title.');
    if (!startDate) return alert('Please choose a start date.');

    const hasTimes = Boolean(startTime || endTime);
    let start, end, allDay;

    if (!hasTimes) {
      start = startDate;                 // all-day (date strings)
      end = endDate || startDate;
      allDay = true;
    } else {
      const s = new Date(`${startDate}T${(startTime || '00:00')}:00`);
      let e2 = endTime
        ? new Date(`${endDate || startDate}T${endTime}:00`)
        : new Date(s.getTime() + 60 * 60 * 1000);
      if (e2 <= s) e2 = new Date(s.getTime() + 60 * 60 * 1000);
      start = s.toISOString();
      end = e2.toISOString();
      allDay = false;
    }

    const payload = { title: title.trim(), notes: (notes || '').trim(), start, end, allDay };
    if (mode === 'edit' && initialEvent) onUpdate?.({ id: initialEvent.id, ...payload });
    else onSave?.(payload);
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  };
  const modal = {
    background: '#fff', borderRadius: 12, width: 420, maxWidth: '90vw',
    padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  };
  const row = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 10,
    alignItems: 'start',
  };
  const label = { display: 'block', fontSize: 12, color: '#555', marginBottom: 6 };
  const input = {
    width: '100%',
    padding: 8,
    borderRadius: 8,
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    display: 'block',
  };
  const btnBar = { display: 'flex', gap: 10, marginTop: 16, justifyContent: 'space-between', alignItems: 'center' };
  const left = { display: 'flex', gap: 10 };
  const right = { display: 'flex', gap: 10 };
  const primary = { padding: '8px 14px', borderRadius: 8, border: 'none', background: '#111827', color: 'white', cursor: 'pointer' };
  const ghost = { padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#111827', cursor: 'pointer' };
  const danger = { padding: '8px 14px', borderRadius: 8, border: '1px solid #f87171', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0 }}>{mode === 'edit' ? 'Edit Event' : 'Add Event'}</h3>

        <div style={{ marginTop: 12 }}>
          <label style={label}>Title</label>
          <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Design Review" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={label}>Notes</label>
          <textarea style={{ ...input, minHeight: 80, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details…" />
        </div>

        <div style={row}>
          <div style={{ flex: 1 }}>
            <label style={label}>Start Date</label>
            <input type="date" style={input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Start Time (optional)</label>
            <input type="time" style={input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>

        <div style={row}>
          <div style={{ flex: 1 }}>
            <label style={label}>End Date</label>
            <input type="date" style={input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>End Time (optional)</label>
            <input type="time" style={input} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div style={btnBar}>
          <div style={left}>
            <button style={ghost} onClick={onClose}>Cancel</button>
            <button style={primary} onClick={handleSubmit}>{mode === 'edit' ? 'Update' : 'Save'}</button>
          </div>
          {mode === 'edit' && initialEvent && (
            <button style={danger} onClick={() => onDelete?.(initialEvent.id)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}