import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { User, X } from 'lucide-react';
import Logo from './img/logo.jpg';
import TriggerIcon from './img/imag1.webp';
import './ChatWidget.css';

// --- UTILITIES (Persistent Session & Logic) ---
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const parseResponse = (originalText) => {
    const cleanText = originalText.replace(/\*\*/g, "");
    const lines = cleanText.split("\n");
    let detectedOptions = [];
    let linesToKeep = [];
    const bulletSymbolRegex = /^[\-\*\•\d][\.\)]?\s+/;

    lines.forEach((line) => {
        let lineText = line.trim();
        if (bulletSymbolRegex.test(lineText)) {
            let option = lineText.replace(bulletSymbolRegex, "").trim();
            if (option.length < 50) detectedOptions.push(option);
        } else if (lineText.length > 1) {
            linesToKeep.push(lineText);
        }
    });
    return { text: linesToKeep.join("\n").trim() || cleanText, options: detectedOptions };
};

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [macId, setMacId] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [activeTab, setActiveTab] = useState("home");

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        let session = localStorage.getItem("chat_session_id") || generateUUID();
        localStorage.setItem("chat_session_id", session);
        setSessionId(session);
        let deviceId = localStorage.getItem("chat_device_mac_id") || generateUUID();
        localStorage.setItem("chat_device_mac_id", deviceId);
        setMacId(deviceId);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 200);
    }, [open, activeTab]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatLog, loading]);

    const toggleWidget = () => {
        if (!open && chatLog.length === 0) setActiveTab("home");
        setOpen(!open);
    };

    const sendMessage = useCallback(async (msgOverride = null) => {
        const msgToSend = msgOverride || message;
        if (!msgToSend || !msgToSend.trim()) return;

        if (activeTab !== "chat") setActiveTab("chat");

        setChatLog((prev) => [
            ...prev.map(m => ({ ...m, interactionDone: true })),
            { sender: "user", text: msgToSend }
        ]);

        if (!msgOverride) setMessage("");
        setLoading(true);

        try {
            const res = await fetch("https://automate.ththeater.com/webhook/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msgToSend, sessionId, macId }),
            });
            const data = await res.json();
            const responseData = Array.isArray(data) ? data[0] : data;
            const { text, options } = parseResponse(responseData.output || responseData.text || "Received");
            setChatLog((prev) => [...prev, { sender: "bot", text, options, interactionDone: false }]);
        } catch (err) {
            setChatLog((p) => [...p, { sender: "bot", text: "Connection error. Please try again.", error: true }]);
        } finally {
            setLoading(false);
        }
    }, [message, sessionId, macId, activeTab]);

    return (
        <div className="cw-scope">
            {/* 1. TRIGGER BUTTON - Chat open hone par hide ho jayega */}
            {!open && (
                <button onClick={toggleWidget} className="chat-toggle">
                    <div className="trigger-glow-bg"></div>

                    {/* Nayi Lines jo hover par ayengi */}
                    <div className="hover-lines">
                        <span className="h-line l-1"></span>
                        <span className="h-line l-2"></span>
                        <span className="h-line l-3"></span>
                    </div>

                    <div className="icon-wrapper">
                        <img src={TriggerIcon} alt="Logo" className="q-icon" />
                    </div>
                </button>
            )}
            {/* 2. CHAT CONTAINER */}
            {open && (
                <div className="quikr-chat-container">
                    <div className="transcend-chat-card">
                        <div className="layer-base-blur"></div>
                        <div className="layer-dark-overlay"></div>
                        <div className="layer-radial-depth"></div>
                        <div className="layer-top-gradient"></div>
                        <div className="layer-border-shadow"></div>
                        <div className="layer-noise"></div>

                        {/* HEADER */}
                        <div className="transcend-chat-header">
                            <div className="header-bg-gradient"></div>
                            <div className="header-shine"></div>
                            <div className="header-content">
                                <img src={Logo} alt="Transcend" className="header-logo" />
                                <div className="header-info">
                                    <div className="title-row">
                                        <h2>Transcend Assistant</h2>
                                        <div className="online-dot"></div>
                                    </div>
                                    <p>Home Theater • Automation • Audio Help</p>
                                </div>
                                <button onClick={() => setOpen(false)} className="header-close-btn">
                                    <X size={16} color="white" />
                                </button>
                            </div>
                            <div className="header-separator"></div>
                        </div>

                        {/* BODY / MESSAGES */}
                        <div className="transcend-chat-body">
                            {/* Fixed Welcome Message */}
                            <div className="msg-row bot">
                                <div className="avatar bot-avatar"><img src={Logo} alt="T" /></div>
                                <div className="bubble bot-bubble">
                                    Welcome to Transcend! 🎬<br />
                                    I'm your Theater Assistant. How can I help you create the ultimate cinematic experience at home?
                                </div>
                            </div>

                            {activeTab === "home" && (
                                <div className="chips-container">
                                    {["Home Theater Estimate", "Automation Setup", "Audio Calibration", "Free Walkthrough"].map(label => (
                                        <button key={label} onClick={() => sendMessage(label)} className="quikr-quick-reply">{label}</button>
                                    ))}
                                </div>
                            )}

                            {activeTab === "chat" && (
                                <>
                                    {chatLog.map((chat, i) => (
                                        <div key={i} className={`msg-group ${chat.sender}`}>
                                            <div className={`msg-row ${chat.sender}`}>

                                                {chat.sender === "bot" && (
                                                    <div className="avatar bot-avatar">
                                                        <img src={Logo} alt="T" />
                                                    </div>
                                                )}

                                                <div className={`bubble-outer ${chat.sender}`}>
                                                    <div className={`bubble ${chat.sender}-bubble`}>
                                                        {chat.text}
                                                    </div>
                                                </div>
                                            </div>
                                            {chat.sender === "bot" && chat.options?.length > 0 && !chat.interactionDone && (
                                                <div className="chips-container">
                                                    {chat.options.map((opt, idx) => (
                                                        <button key={idx} onClick={() => sendMessage(opt)} className="quikr-quick-reply">{opt}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="msg-row bot animate-pulse">
                                            <div className="avatar bot-avatar"><img src={Logo} alt="T" /></div>
                                            <div className="bubble-outer bot">
                                                <div className="bubble bot-bubble typing-container">
                                                    <div className="cw-bubble-overlay"></div>
                                                    <div className="typing-dots">
                                                        <span></span><span></span><span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </>
                            )}
                        </div>

                        {/* FOOTER / INPUT */}
                        <div className="transcend-chat-footer">
                            <div className="input-container">
                                <div className="input-border-glow"></div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="How can we help you?"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                />
                                <button onClick={() => sendMessage()} disabled={!message.trim() || loading} className="send-button">
                                    <div className="send-btn-border"></div>
                                    <div className="send-btn-base-glow"></div>
                                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" class="relative z-10 translate-x-[1px]"><path d="M13 1L6 8M13 1L9 13L6 8M13 1L1 5L6 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                </button>
                            </div>
                            <a href="https://www.quikrai.us/" target="_blank" rel="noopener noreferrer">

                            <div className="powered-by">Powered by Quikr AI</div>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}