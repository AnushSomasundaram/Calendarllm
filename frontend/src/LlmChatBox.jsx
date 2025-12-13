// import React, { useState } from "react";

// export default function LlmChatBox({ onSend }) {
//     const [isOpen, setIsOpen] = useState(false);
//     const [input, setInput] = useState("");
//     const [messages, setMessages] = useState([]);

//     const handleToggle = () => setIsOpen((prev) => !prev);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const trimmed = input.trim();
//         if (!trimmed) return;

//         const userMessage = { role: "user", content: trimmed };
//         setMessages((prev) => [...prev, userMessage]);
//         setInput("");

//         if (onSend) {
//             try {
//                 const reply = await onSend(trimmed);
//                 if (reply) {
//                     setMessages((prev) => [
//                         ...prev,
//                         userMessage,
//                         { role: "assistant", content: reply },
//                     ]);
//                 }
//             } catch (err) {
//                 console.error("LLM error:", err);
//                 setMessages((prev) => [
//                     ...prev,
//                     userMessage,
//                     {
//                         role: "assistant",
//                         content: "Sorry, something went wrong talking to the LLM.",
//                     },
//                 ]);
//             }
//         }
//     };

//     return (
//         <>
//             {/* Floating toggle button */}
//             <button
//                 onClick={handleToggle}
//                 style={{
//                     position: "fixed",
//                     bottom: "1rem",
//                     right: "1rem",
//                     width: "48px",
//                     height: "48px",
//                     borderRadius: "999px",
//                     border: "none",
//                     background: "#2563eb",
//                     color: "#ffffff",
//                     fontSize: "20px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
//                     zIndex: 1000,
//                     cursor: "pointer",
//                 }}
//             >
//                 💬
//             </button>

//             {/* Chat panel */}
//             {isOpen && (
//                 <div
//                     style={{
//                         position: "fixed",
//                         bottom: "4.5rem",
//                         right: "1rem",
//                         // 🔹 Responsive sizing
//                         width: "min(340px, 90vw)",
//                         height: "min(380px, 60vh)",
//                         background: "#ffffff", // 🔹 white background
//                         color: "#111827",
//                         borderRadius: "12px",
//                         boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
//                         display: "flex",
//                         flexDirection: "column",
//                         overflow: "hidden",
//                         zIndex: 1000,
//                         border: "1px solid #d1d5db",
//                     }}
//                 >
//                     {/* Header */}
//                     <div
//                         style={{
//                             padding: "8px 12px",
//                             borderBottom: "1px solid #e5e7eb",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "space-between",
//                             fontSize: "14px",
//                             background: "#f3f4f6",
//                         }}
//                     >
//                         <span style={{ fontWeight: 500 }}>Calendar LLM</span>
//                         <button
//                             onClick={handleToggle}
//                             style={{
//                                 border: "none",
//                                 background: "transparent",
//                                 color: "#6b7280",
//                                 cursor: "pointer",
//                                 fontSize: "16px",
//                             }}
//                         >
//                             ✕
//                         </button>
//                     </div>

//                     {/* Messages */}
//                     <div
//                         style={{
//                             flex: 1,
//                             padding: "8px 10px",
//                             overflowY: "auto",
//                             fontSize: "13px",
//                             background: "#ffffff",
//                         }}
//                     >
//                         {messages.length === 0 && (
//                             <div
//                                 style={{
//                                     color: "#9ca3af",
//                                     fontStyle: "italic",
//                                 }}
//                             >
//                                 Ask me to create events, find free time, or answer questions
//                                 about your calendar.
//                             </div>
//                         )}

//                         {messages.map((m, idx) => (
//                             <div
//                                 key={idx}
//                                 style={{
//                                     marginBottom: "6px",
//                                     textAlign: m.role === "user" ? "right" : "left",
//                                 }}
//                             >
//                                 <div
//                                     style={{
//                                         display: "inline-block",
//                                         padding: "6px 8px",
//                                         borderRadius: "12px",
//                                         // 🔹 Blue message boxes with white text
//                                         background:
//                                             m.role === "user" ? "#2563eb" : "#3b82f6",
//                                         color: "#ffffff",
//                                         maxWidth: "90%",
//                                         whiteSpace: "pre-wrap",
//                                         wordBreak: "break-word",
//                                     }}
//                                 >
//                                     {m.content}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>

//                     {/* Input */}
//                     <form
//                         onSubmit={handleSubmit}
//                         style={{
//                             padding: "8px",
//                             borderTop: "1px solid #e5e7eb",
//                             display: "flex",
//                             gap: "6px",
//                             background: "#f9fafb",
//                         }}
//                     >
//                         <input
//                             type="text"
//                             placeholder="Ask your calendar..."
//                             value={input}
//                             onChange={(e) => setInput(e.target.value)}
//                             style={{
//                                 flex: 1,
//                                 borderRadius: "999px",
//                                 border: "1px solid #d1d5db",
//                                 padding: "6px 10px",
//                                 fontSize: "13px",
//                                 background: "#ffffff",
//                                 color: "#111827",
//                                 outline: "none",
//                             }}
//                         />
//                         <button
//                             type="submit"
//                             style={{
//                                 borderRadius: "999px",
//                                 border: "none",
//                                 padding: "6px 12px",
//                                 fontSize: "13px",
//                                 background: "#2563eb",
//                                 color: "#ffffff",
//                                 cursor: "pointer",
//                                 whiteSpace: "nowrap",
//                             }}
//                         >
//                             Send
//                         </button>
//                     </form>
//                 </div>
//             )}
//         </>
//     );
// }

import React, { useState } from "react";

export default function LlmChatBox({ onSend }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);

    const handleToggle = () => setIsOpen((prev) => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;

        const userMessage = { role: "user", content: trimmed };
        // 🔹 Add user message once
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        if (onSend) {
            try {
                const reply = await onSend(trimmed);
                if (reply) {
                    // 🔹 Only add the assistant message now
                    setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: reply },
                    ]);
                }
            } catch (err) {
                console.error("LLM error:", err);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Sorry, something went wrong talking to the LLM.",
                    },
                ]);
            }
        }
    };

    return (
        <>
            {/* Floating toggle button */}
            <button
                onClick={handleToggle}
                style={{
                    position: "fixed",
                    bottom: "1rem",
                    right: "1rem",
                    width: "48px",
                    height: "48px",
                    borderRadius: "999px",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    zIndex: 1000,
                    cursor: "pointer",
                }}
            >
                💬
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "4.5rem",
                        right: "1rem",
                        width: "min(340px, 90vw)",
                        height: "min(380px, 60vh)",
                        background: "#ffffff",
                        color: "#111827",
                        borderRadius: "12px",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        zIndex: 1000,
                        border: "1px solid #d1d5db",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            background: "#f3f4f6",
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>Calendar LLM</span>
                        <button
                            onClick={handleToggle}
                            style={{
                                border: "none",
                                background: "transparent",
                                color: "#6b7280",
                                cursor: "pointer",
                                fontSize: "16px",
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            padding: "8px 10px",
                            overflowY: "auto",
                            fontSize: "13px",
                            background: "#ffffff",
                        }}
                    >
                        {messages.length === 0 && (
                            <div
                                style={{
                                    color: "#9ca3af",
                                    fontStyle: "italic",
                                }}
                            >
                                Ask me to create events, find free time, or answer questions
                                about your calendar.
                            </div>
                        )}

                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                style={{
                                    marginBottom: "6px",
                                    textAlign: m.role === "user" ? "right" : "left",
                                }}
                            >
                                <div
                                    style={{
                                        display: "inline-block",
                                        padding: "6px 8px",
                                        borderRadius: "12px",
                                        background:
                                            m.role === "user" ? "#2563eb" : "#3b82f6",
                                        color: "#ffffff",
                                        maxWidth: "90%",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            padding: "8px",
                            borderTop: "1px solid #e5e7eb",
                            display: "flex",
                            gap: "6px",
                            background: "#f9fafb",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Ask your calendar..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            style={{
                                flex: 1,
                                borderRadius: "999px",
                                border: "1px solid #d1d5db",
                                padding: "6px 10px",
                                fontSize: "13px",
                                background: "#ffffff",
                                color: "#111827",
                                outline: "none",
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                borderRadius: "999px",
                                border: "none",
                                padding: "6px 12px",
                                fontSize: "13px",
                                background: "#2563eb",
                                color: "#ffffff",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
