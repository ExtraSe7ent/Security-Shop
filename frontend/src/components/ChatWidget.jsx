import { useState } from 'react'
import axios from 'axios'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m the SecurityShop assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:8000/api/chat/', {
        message: userMsg
      })
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Cửa sổ chat */}
      {open && (
        <div style={styles.chatBox}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.avatar}>🛡️</span>
              <div>
                <div style={styles.botName}>SecurityShop Assistant</div>
                <div style={styles.botStatus}>● Online</div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.userMsg : styles.botMsg)
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.message, ...styles.botMsg }}>
                <span style={styles.typing}>● ● ●</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <input
              style={styles.input}
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Nút mở chat nổi góc phải */}
      <button style={styles.fab} onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 1000,
  },
  fab: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#0f3460',
    color: 'white',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  chatBox: {
    width: '340px',
    height: '480px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  header: {
    background: '#0f3460',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: { fontSize: '24px' },
  botName: { color: 'white', fontWeight: '600', fontSize: '14px' },
  botStatus: { color: '#90ee90', fontSize: '11px' },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  message: {
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    maxWidth: '80%',
    wordBreak: 'break-word',
  },
  botMsg: {
    background: '#f0f0f0',
    color: '#333',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  userMsg: {
    background: '#0f3460',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  typing: {
    color: '#999',
    fontSize: '18px',
    letterSpacing: '2px',
  },
  inputArea: {
    padding: '12px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontSize: '14px',
    outline: 'none',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    background: '#0f3460',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}