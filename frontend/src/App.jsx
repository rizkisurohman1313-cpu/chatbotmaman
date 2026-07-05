import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Trash2, Wifi, WifiOff, Database } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const INITIAL_MESSAGE = {
  role: 'bot',
  content: 'Halo! Saya **Asisten Maman AI** 👋\n\nSaya siap membantu Anda dalam:\n- 🗄️ Merancang query **SQL Server (T-SQL)** dan **SQLite**\n- 🔀 Logika kondisional **CASE**, fungsi **agregat**, dan **UNION**\n- 🔄 Manipulasi **JSON** dan pola **asynchronous** di JavaScript\n\nBagikan skema tabel atau deskripsi masalah Anda, dan kita selesaikan bersama!',
  timestamp: new Date(),
};

function formatTime(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(null); // null=checking, true=ok, false=error
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_BASE}/api/health`, { timeout: 3000 });
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, {
        message: userMessage.content,
        session_id: sessionId,
      });
      setMessages(prev => [...prev, {
        role: 'bot',
        content: response.data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      let errorMsg = 'Maaf, terjadi kesalahan saat menghubungi server. Pastikan backend Python sedang berjalan.';
      if (error.response?.data?.error) {
        errorMsg = `⚠️ Error: ${error.response.data.error}`;
      }
      setMessages(prev => [...prev, { role: 'bot', content: errorMsg, timestamp: new Date(), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await axios.post(`${API_BASE}/api/reset`, { session_id: sessionId });
    } catch { /* ignore */ }
    setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="app-container">
      {/* Animated background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-icon">
            <Database size={22} />
          </div>
          <div className="header-text">
            <h1>Asisten Maman</h1>
            <span className="header-subtitle">SQL & Backend Intelligence</span>
          </div>
        </div>
        <div className="header-right">
          <div className={`status-badge ${isConnected === true ? 'connected' : isConnected === false ? 'disconnected' : 'checking'}`}>
            {isConnected === true ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isConnected === true ? 'Online' : isConnected === false ? 'Offline' : '...'}</span>
          </div>
          <button
            className="clear-btn"
            onClick={handleClearChat}
            title="Hapus riwayat chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <div className="avatar">
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="message-body">
              <div className="message-content">
                {msg.role === 'bot' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.timestamp && (
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot">
            <div className="avatar"><Bot size={18} /></div>
            <div className="message-body">
              <div className="typing-indicator">
                <span>Asisten Maman sedang mengetik</span>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="input-container" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pertanyaan SQL atau integrasi data Anda... (Enter untuk kirim, Shift+Enter untuk baris baru)"
          disabled={isLoading}
          rows={1}
        />
        <button type="submit" disabled={!input.trim() || isLoading} title="Kirim pesan">
          <Send size={18} />
        </button>
      </form>
      <p className="input-hint">Shift + Enter untuk baris baru · Enter untuk kirim</p>
    </div>
  );
}

export default App;
