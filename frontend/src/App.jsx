// import React, { useState, useEffect } from 'react';
// import Calendar from './Calendar';
// import MenuBar from './MenuBar';
// import ApiKeyModal from './ApiKeyModel';
// import LlmChatBox from './LlmChatBox';
// import "./App.css";

// export default function App() {
//   const [apiKey, setApiKey] = useState("");
//   const [isApiModalOpen, setIsApiModalOpen] = useState(false);

//   // Load OpenAI key from SQLite on startup (via Electron)
//   useEffect(() => {
//     if (window.calendarDB?.getOpenAIKey) {
//       window.calendarDB.getOpenAIKey().then((key) => {
//         if (key) {
//           setApiKey(key);
//         }
//       });
//     }
//   }, []);

//   const handleSaveApiKey = (newKey) => {
//     setApiKey(newKey);
//     if (window.calendarDB?.setOpenAIKey) {
//       window.calendarDB.setOpenAIKey(newKey);
//     }
//   };

//   // 🔹 This is the only new logic that connects UI -> Python
//   const handleLlmSend = async (message) => {
//     try {
//       const res = await fetch("http://127.0.0.1:8000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message }),
//       });

//       if (!res.ok) {
//         console.error("LLM backend error:", res.status, await res.text());
//         return "Backend error while talking to the calendar LLM.";
//       }

//       const data = await res.json(); // { reply: "..." }
//       return data.reply || "I didn't get a reply from the calendar LLM.";
//     } catch (err) {
//       console.error("Error calling LLM backend:", err);
//       return "Could not reach the calendar LLM backend. Is the Python server running?";
//     }
//   };

//   return (
//     <div
//       className="App"
//       style={{
//         width: '100%',
//         height: '97vh',
//         display: 'flex',
//         flexDirection: 'column',
//         background: 'black',
//         color: 'black',
//         overflow: "hidden",
//       }}
//     >
//       <MenuBar onOpenApiModal={() => setIsApiModalOpen(true)} />

//       <div style={{ flex: 1, overflow: 'hidden' }}>
//         <Calendar />
//       </div>

//       {isApiModalOpen && (
//         <ApiKeyModal
//           initialKey={apiKey}
//           onSave={handleSaveApiKey}
//           onClose={() => setIsApiModalOpen(false)}
//         />
//       )}

//       {/* Floating chat UI talking to Python */}
//       <LlmChatBox onSend={handleLlmSend} />
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import Calendar from './Calendar';
import MenuBar from './MenuBar';
import ApiKeyModal from './ApiKeyModel';
import LlmChatBox from './LlmChatBox';
import "./App.css";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Load OpenAI key from SQLite on startup (via Electron)
  useEffect(() => {
    if (window.calendarDB?.getOpenAIKey) {
      window.calendarDB.getOpenAIKey().then((key) => {
        if (key) {
          setApiKey(key);
        }
      });
    }
  }, []);

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (window.calendarDB?.setOpenAIKey) {
      window.calendarDB.setOpenAIKey(newKey);
    }
  };

  // 🔹 NEW: use Electron IPC -> Python instead of HTTP fetch
  const handleLlmSend = async (message) => {
    try {
      if (!window.calendarDB?.llmChat) {
        console.error("calendarDB.llmChat is not available");
        return "LLM backend is not available in this environment.";
      }

      const reply = await window.calendarDB.llmChat(message);
      return reply || "I didn't get a reply from the calendar LLM.";
    } catch (err) {
      console.error("Error calling LLM backend via IPC:", err);
      return "Could not reach the calendar LLM backend.";
    }
  };

  return (
    <div
      className="App"
      style={{
        width: '100%',
        height: '97vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'black',
        color: 'black',
        overflow: "hidden",
      }}
    >
      <MenuBar onOpenApiModal={() => setIsApiModalOpen(true)} />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Calendar />
      </div>

      {isApiModalOpen && (
        <ApiKeyModal
          initialKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setIsApiModalOpen(false)}
        />
      )}

      {/* Floating chat UI talking to Python via IPC */}
      <LlmChatBox onSend={handleLlmSend} />
    </div>
  );
}