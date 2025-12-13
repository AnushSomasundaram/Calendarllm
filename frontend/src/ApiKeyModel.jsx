// src/ApiKeyModal.jsx
import React, { useState, useEffect } from "react";
import "./ApiKeyModel.css";

export default function ApiKeyModal({ initialKey, onSave, onClose }) {
    const [value, setValue] = useState(initialKey || "");

    useEffect(() => {
        setValue(initialKey || "");
    }, [initialKey]);

    const handleSave = () => {
        onSave(value.trim());
        onClose();
    };

    return (
        <div className="api-modal-backdrop">
            <div className="api-modal">
                <h2>OpenAI API Key</h2>
                <p className="api-modal-description">
                    Paste your OpenAI API key here. It will be used only on your machine
                    to call the API.
                </p>

                <input
                    type="password"
                    className="api-modal-input"
                    placeholder="sk-..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />

                <div className="api-modal-actions">
                    <button className="api-modal-button secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="api-modal-button primary" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}