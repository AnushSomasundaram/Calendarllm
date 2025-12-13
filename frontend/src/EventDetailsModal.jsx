import React from 'react';

export default function EventDetailsModal({ isOpen, event, onClose, onEdit, onDelete }) {
  if (!isOpen || !event) return null;

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  };
  const modal = {
    background: 'white', borderRadius: 12, width: 460, maxWidth: '92vw',
    padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  };
  const row = { marginTop: 10 };
  const label = { fontSize: 12, color: '#6b7280', marginBottom: 4 };
  const val = { fontSize: 14, color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
  const bar = { display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' };
  const btn = (filled=false)=>({
    padding:'8px 14px', borderRadius:8, cursor:'pointer',
    border: filled ? 'none' : '1px solid #ddd',
    background: filled ? '#111827' : 'white',
    color: filled ? 'white' : '#111827',
  });

  const start = event.start ? new Date(event.start) : null;
  const end   = event.end   ? new Date(event.end)   : null;

  const fmt = (d) => d?.toLocaleString?.() || String(d);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e)=>e.stopPropagation()}>
        <h3 style={{ margin: 0 }}>{event.title}</h3>

        <div style={row}>
          <div style={label}>When</div>
          <div style={val}>
            {event.allDay
              ? `${event.start?.toString().slice(0,10)} → ${event.end?.toString().slice(0,10)} (all-day)`
              : `${fmt(start)} → ${fmt(end)}`}
          </div>
        </div>

        {event.extendedProps?.notes && (
          <div style={row}>
            <div style={label}>Notes</div>
            <div style={val}>{event.extendedProps.notes}</div>
          </div>
        )}

        <div style={bar}>
          {onDelete && <button style={btn(false)} onClick={()=>onDelete(event.id)}>Delete</button>}
          {onEdit &&   <button style={btn(false)} onClick={()=>onEdit(event.id)}>Edit</button>}
          <button style={btn(true)} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}