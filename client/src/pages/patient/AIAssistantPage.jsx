import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../services/api';
import {
  Bot,
  HeartPulse,
  Info,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  Zap
} from 'lucide-react';

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Summarize my blood pressure readings from this month.',
    'What does my recorded resting heart rate mean?',
    'What questions should I ask my doctor about these readings?',
    'Explain normal fasting blood glucose targets.',
    'How do hydration and sleep impact cardiovascular recovery?'
  ];

  const fetchHistory = async () => {
    try {
      const res = await apiRequest('/ai/chat/history');
      if (res.success && res.messages && res.messages.length > 0) {
        setMessages(res.messages);
        setConversationId(res.conversationId);
      } else {
        // Default welcoming message
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I am your AI Health Assistant. I am here to help you understand your recorded vitals, analyze trends, explain physiological concepts, and prepare questions for your healthcare appointments.\n\nHow can I help you understand your health information today?`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim()) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          conversationId
        })
      });

      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply,
            source: res.source,
            timestamp: new Date()
          }
        ]);
        if (res.conversationId) setConversationId(res.conversationId);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="title-xl" style={{ margin: 0 }}>AI Health Assistant</h1>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              CLINICAL VITAL INTELLIGENCE
            </span>
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Context-aware physiological explanations and physician consultation prep
          </p>
        </div>
      </div>

      {/* Mandatory Medical Safety Disclaimer Pill */}
      <div style={{
        background: 'rgba(14, 165, 233, 0.08)',
        border: '1px dashed rgba(14, 165, 233, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.78rem',
        color: '#7dd3fc'
      }}>
        <ShieldAlert size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
        <span>
          <strong>Informational Tool Only:</strong> AI responses are strictly educational and do not constitute a medical diagnosis, triage determination, or prescription advice. Always discuss readings with your doctor.
        </span>
      </div>

      {/* Chat Messages Body */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div style={{
                  background: isUser ? '#0284c7' : '#1e293b',
                  color: '#ffffff',
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: isUser ? 'none' : '1px solid var(--border)'
                }}>
                  {m.content}

                  {!isUser && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '0.68rem',
                      color: '#94a3b8',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      paddingTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>AI-Generated Educational Content</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f8fafc',
                    flexShrink: 0
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} color="#38bdf8" />
              </div>
              <span>AI is reviewing your clinical vitals and formulating insights...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 0 8px',
          borderTop: '1px solid var(--border)',
          whiteSpace: 'nowrap'
        }}>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{ display: 'flex', gap: '10px', marginTop: '6px' }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Ask a question about your readings or health trends..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            style={{ borderRadius: 'var(--radius-md)' }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !inputMessage.trim()}
            style={{ padding: '0 20px' }}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
