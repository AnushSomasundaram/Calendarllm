// src/MenuBar.jsx
import React from "react";
import "./MenuBar.css";

function MenuBar({ onOpenApiModal }) {
    return (
        <header className="menu-bar">
            <div className="menu-left">
                <span className="app-title">Calendar LLM</span>
            </div>

            <div className="menu-right">
                <button className="api-button" onClick={onOpenApiModal}>
                    Set OpenAI API Key
                </button>
            </div>
        </header>
    );
}

export default MenuBar;