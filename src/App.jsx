import { useState, useEffect, useRef } from 'react'

const App = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [aiReady, setAiReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const checkReady = setInterval(() => {
      if (window.puter && window.puter.ai && typeof window.puter.ai.chat === "function") {
        setAiReady(true)
        clearInterval(checkReady)
      }
    }, 300);
    return () => clearInterval(checkReady)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const extractTextFromPayload = (payload) => {
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload)
        if (parsed && typeof parsed === 'object' && parsed.type === 'text' && typeof parsed.text === 'string') {
          return parsed.text
        }
      } catch {
        // Not a JSON string, use the original value.
      }
      return payload
    }

    if (Array.isArray(payload)) {
      const textParts = payload
        .map((item) => extractTextFromPayload(item))
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
      return textParts.length ? textParts.join('\n') : null
    }

    if (payload && typeof payload === 'object') {
      if (payload.type === 'text' && typeof payload.text === 'string') {
        return payload.text
      }
      if (typeof payload.content === 'string') {
        return payload.content
      }
    }

    return null
  }

  const addMessage = (msg, isUser) => {
    // Ensure content is a string to prevent React rendering crashes ("white blank page")
    let safeContent = "🤖 Error parsing response";
    if (typeof msg === 'string') {
      safeContent = msg;
    } else if (Array.isArray(msg)) {
      safeContent = msg.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
    } else if (msg !== null && typeof msg === 'object') {
      safeContent = JSON.stringify(msg, null, 2);
    } else {
      safeContent = String(msg);
    }
    setMessages((prev) => [...prev, { content: safeContent, isUser, id: Date.now() + Math.random()}])
  }

  const handleSend = async () => {
    const message = inputValue.trim()
    if(!message) return

    if(!aiReady){
      addMessage("Please wait for the AI to load.", false)
      return
    }

    addMessage(message, true)
    setInputValue('')
    setIsLoading(true)
    
    try {
      const response = await window.puter.ai.chat(message)
      
      // Safely extract the reply string, handling PuterChatResponse objects
      let reply = "🤖 No reply from AI"
      const parsedMessageContent = extractTextFromPayload(response?.message?.content)
      const parsedResponseText = extractTextFromPayload(response?.text)
      const parsedResponse = extractTextFromPayload(response)

      if (parsedMessageContent) {
        reply = parsedMessageContent
      } else if (parsedResponseText) {
        reply = parsedResponseText
      } else if (parsedResponse) {
        reply = parsedResponse
      } else if (response && typeof response.toString === 'function' && response.toString() !== '[object Object]') {
        reply = response.toString()
      }
      addMessage(reply, false)
    } catch (error) {
      addMessage("Error: Could not get response from AI. " + error.message, false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Enter' && e.shiftKey){
      e.preventDefault()
      handleSend()
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-sky-900 via-slate-950 to-emerald-900 flex flex-col items-center justify-center p-4 gap-8'>
      <h1 className='text-6xl sm:text-7xl font-semibold h-20 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500 bg-clip-text text-transparent'>
        AI Chat App
      </h1>

      {/* Chat Container */}
      <div className='flex-1 w-full max-w-2xl bg-slate-900/80 backdrop-blur-md rounded-2xl flex flex-col border border-white/10 shadow-2xl'>
        
        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar'>
          {messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-slate-400 text-center px-4'>
              <div className='bg-blue-500/10 p-4 rounded-full mb-4'>
                {/* Chat bubble icon */}
                <svg className='w-12 h-12 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold mb-2 text-white'>Welcome to AI Chat!</h3>
              <p className='text-slate-400 text-lg'>Start a conversation by typing a message below</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.isUser ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                  {msg.isUser ? (
                    <svg className='w-5 h-5 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                    </svg>
                  ) : (
                    <svg className='w-5 h-5 text-emerald-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-lg px-5 py-3 text-white rounded-3xl text-lg leading-relaxed shadow-md whitespace-pre-wrap break-words ${msg.isUser ? 'bg-blue-600/30 rounded-tr-none' : 'bg-slate-800/50 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                  <span className='text-xs text-slate-500 mt-1 px-1'>{formatDate(msg.timestamp || Date.now())}</span>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className='flex gap-4 items-start'>
              <div className='w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0'>
                <svg className='w-5 h-5 text-emerald-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
              </div>
              <div className='bg-slate-800/50 px-5 py-3 rounded-3xl rounded-tl-none'>
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
                  <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></div>
                  <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className='p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm'>
          <div className='flex items-end gap-3'>
            <div className='flex-1 relative'>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!aiReady || isLoading}
                placeholder={!aiReady ? "AI is loading..." : "Type your message... (Shift+Enter for newline)"}
                rows={inputValue.split('\n').length > 3 ? 3 : 1}
                className='w-full resize-none p-4 pr-10 rounded-2xl bg-slate-800/60 text-white border-2 border-white/10 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all text-lg placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed'
              />
              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!aiReady || isLoading || !inputValue.trim()}
                className={`absolute bottom-4 right-4 p-2 rounded-xl transition-all ${!aiReady || isLoading || !inputValue.trim() ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg hover:shadow-blue-600/50'}`}
                title="Send Message"
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                </svg>
              </button>
            </div>
          </div>
          <div className='flex items-center justify-between mt-2 text-xs text-slate-500 px-2'>
            <span>
              {!aiReady ? (
                <span className='text-orange-400 flex items-center gap-1.5'>
                  <svg className='w-4 h-4 animate-spin' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707 1.414M4.93 19.07l1.414-.707M19.07 4.93l-1.414 1.414' />
                  </svg>
                  Initializing AI...
                </span>
              ) : (
                <span className='text-emerald-400 flex items-center gap-1.5'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  AI Ready
                </span>
              )}
            </span>
            <span className='text-slate-600'>
              Made With ❤️ By <span className='font-medium text-blue-400'>Youssef</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App