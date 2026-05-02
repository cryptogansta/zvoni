'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Send } from 'lucide-react'
import clsx from 'clsx'

export interface ChatMessage {
  id: string
  text: string
  type: 'USER' | 'SYSTEM'
  createdAt: string
  senderName: string
  senderId: string | null
  isGuest: boolean
}

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClose: () => void
  participantName: string
}

export function ChatPanel({ messages, onSend, onClose, participantName }: ChatPanelProps) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-80 min-w-[20rem]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Чат</h3>
        <button onClick={onClose} className="text-muted hover:text-text">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-muted text-sm py-8">Сообщений пока нет</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === 'SYSTEM' ? (
              <div className="text-center">
                <span className="text-xs text-muted bg-surface-elevated px-2 py-0.5 rounded-full">{msg.text}</span>
              </div>
            ) : (
              <div className={clsx('flex flex-col gap-0.5', msg.senderName === participantName && 'items-end')}>
                <span className="text-xs text-muted px-1">{msg.senderName}</span>
                <div
                  className={clsx(
                    'px-3 py-2 rounded-2xl text-sm max-w-[90%] break-words',
                    msg.senderName === participantName
                      ? 'bg-accent text-bg rounded-br-sm'
                      : 'bg-surface-elevated text-text rounded-bl-sm',
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted px-1">
                  {new Date(msg.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          className="input flex-1 py-2 text-sm"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary w-10 h-10 rounded-xl flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
