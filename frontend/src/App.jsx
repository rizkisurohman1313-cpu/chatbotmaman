import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Trash2, Wifi, WifiOff, Database, Settings, X, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';

const API_BASE = 'https://chatbotmaman.vercel.app';

// ============================================================
// Configuration Options
// ============================================================
const TONE_OPTIONS = [
  { id: 'formal',   label: 'Formal & Profesional', emoji: '🎓', desc: 'Gaya asisten dosen / senior dev' },
  { id: 'santai',   label: 'Santai & Akrab',        emoji: '😊', desc: 'Bahasa sehari-hari yang friendly' },
  { id: 'jaksel',   label: 'Anak Jaksel',            emoji: '✨', desc: 'Campur-campur, literally keren' },
];

const TOPIC_OPTIONS = [
  { id: 'database',  label: 'Database & SQL',    emoji: '🗄️', desc: 'Query kompleks, T-SQL, SQLite' },
  { id: 'frontend',  label: 'Frontend & JS',     emoji: '⚡', desc: 'JSON, async/await, integrasi API' },
  { id: 'edukasi',   label: 'Edukasi Umum',      emoji: '📚', desc: 'Penjelasan ramah pemula' },
  { id: 'kesehatan', label: 'Kesehatan (HealthTech)', emoji: '🏥', desc: 'Data pasien, rekam medis' },
  { id: 'hobi',      label: 'Hobi & Game',        emoji: '🎮', desc: 'Analogi RPG, e-sports, musik' },
];

const INITIAL_MESSAGE = {
  role: 'bot',
  content: 'Halo! Saya **Asisten Maman AI** 👋\n\nSaya siap membantu Anda dengan berbagai topik!\n- 🗄️ Query **SQL Server (T-SQL)** dan **SQLite**\n- ⚡ Logika **async/await** dan parsing **JSON**\n- 📚 Penjelasan konsep yang mudah dipahami\n\nSilakan atur **Gaya Bahasa** dan **Topik** terlebih dahulu, lalu mulai tanya!',
  timestamp: new Date(),
};

function formatTime(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [tone, setTone] = useState('formal');
  const [topic, setTopic] = useState('database');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_BASE}/api/health`, { timeout: 4000 });
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
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
        tone: tone,
        topic: topic,
      });
      setMessages(prev => [...prev, {
        role: 'bot',
        content: response.data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      let errorMsg = 'Maaf, terjadi kesalahan. Pastikan koneksi internet Anda stabil.';
      if (error.response?.data?.error) {
        errorMsg = `⚠️ **Error:** ${error.response.data.error}`;
      }
      setMessages(prev => [...prev, { role: 'bot', content: errorMsg, timestamp: new Date(), isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try { await axios.post(`${API_BASE}/api/reset`, { session_id: sessionId }); } catch {}
    setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const currentTone  = TONE_OPTIONS.find(t => t.id === tone);
  const currentTopic = TOPIC_OPTIONS.find(t => t.id === topic);

  return (
    <div className="app-container">
      {/* Animated background */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-icon">
            <Database size={20} />
          </div>
          <div className="header-text">
            <h1>Asisten Maman</h1>
            <span className="header-subtitle">SQL &amp; Backend Intelligence</span>
          </div>
        </div>

        <div className="header-center">
          <div className="active-config-badge">
            <span>{currentTone?.emoji} {currentTone?.label}</span>
            <span className="config-divider">·</span>
            <span>{currentTopic?.emoji} {currentTopic?.label}</span>
          </div>
        </div>

        <div className="header-right">
          <div className={`status-badge ${isConnected === true ? 'connected' : isConnected === false ? 'disconnected' : 'checking'}`}>
            {isConnected === true ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isConnected === true ? 'Online' : isConnected === false ? 'Offline' : '...'}</span>
          </div>
          <button
            className={`icon-btn settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(v => !v)}
            title="Pengaturan Gaya & Topik"
          >
            <Settings size={16} />
          </button>
          <button className="icon-btn danger-btn" onClick={handleClearChat} title="Hapus riwayat">
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <div className={`settings-panel ${showSettings ? 'open' : ''}`}>
        <div className="settings-panel-inner">

          {/* Tone Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <MessageSquare size={14} />
              <span>Gaya Bahasa</span>
            </div>
            <div className="pill-group">
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`pill-btn ${tone === opt.id ? 'active' : ''}`}
                  onClick={() => setTone(opt.id)}
                  title={opt.desc}
                >
                  <span className="pill-emoji">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Section */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Sparkles size={14} />
              <span>Topik Pembicaraan</span>
            </div>
            <div className="pill-group">
              {TOPIC_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`pill-btn ${topic === opt.id ? 'active' : ''}`}
                  onClick={() => setTopic(opt.id)}
                  title={opt.desc}
                >
                  <span className="pill-emoji">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="close-settings-btn" onClick={() => setShowSettings(false)}>
            <X size={14} />
            <span>Tutup &amp; Terapkan</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <div className="avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
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
            <div className="avatar"><Bot size={16} /></div>
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Tanya sesuatu tentang ${currentTopic?.label}... (Enter untuk kirim)`}
          disabled={isLoading}
          rows={1}
        />
        <button type="submit" disabled={!input.trim() || isLoading} title="Kirim pesan">
          <Send size={17} />
        </button>
      </form>
      <p className="input-hint">
        <span>{currentTone?.emoji} {currentTone?.label}</span>
        <span className="hint-dot">·</span>
        <span>{currentTopic?.emoji} {currentTopic?.label}</span>
        <span className="hint-dot">·</span>
        <span>Shift+Enter untuk baris baru</span>
      </p>
    </div>
  );
}

export default App;
