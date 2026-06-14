import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import DOMPurify from 'dompurify';
import { chatAPI } from '../api';
import { useLang } from '../contexts/LangContext';
import { useMode } from '../contexts/ModeContext';

export default function ChatWidget() {
  const location = useLocation();
  const match = location.pathname.match(/\/products\/(\d+)/);
  const productId = match ? match[1] : null; // extract product ID from URL
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { t } = useLang();
  const { mode } = useMode();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'bot', content: t('chat_greeting') }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Pass product_id so chatbot loads product reviews into context
      // This is the attack vector for Prompt Injection demo (#4 & #5)
      const res = await chatAPI.send(userMessage, productId ? parseInt(productId) : null);
      const botResponse = res.data.reply;
      const isInjected = res.data.guardrails_applied || false;
      setMessages(prev => [...prev, {
        role: 'bot',
        content: botResponse,
        injected: isInjected,
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat FAB */}
      {!isOpen && (
        <button
          className="chat-fab"
          onClick={() => setIsOpen(true)}
          id="chat-fab"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" id="chat-window">
          <div className="chat-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} />
              {t('chat_title')}
              <span className={`badge ${mode === 'secure' ? 'badge-secure' : 'badge-base'}`}>
                {mode}
              </span>
            </h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => {
              const safeContent = mode === 'secure' ? DOMPurify.sanitize(msg.content) : msg.content;
              return (
                <div
                  key={i}
                  className={`chat-message ${msg.role}${msg.injected ? ' injected' : ''}`}
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                />
              );
            })}
            {isTyping && (
              <div className="chat-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat_placeholder')}
              id="chat-input"
            />
            <button
              className="btn btn-primary btn-icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              id="chat-send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
