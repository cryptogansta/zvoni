'use client'
import { useState } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Subtitles, PhoneOff, Copy, Check } from 'lucide-react'
import clsx from 'clsx'

interface ControlBarProps {
  isMicOn: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  isChatOpen: boolean
  isTranscriptionOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
  onToggleChat: () => void
  onToggleTranscription: () => void
  onEndCall: () => void
  inviteLink: string
}

export function ControlBar({
  isMicOn, isCameraOn, isScreenSharing, isChatOpen, isTranscriptionOn,
  onToggleMic, onToggleCamera, onToggleScreenShare, onToggleChat, onToggleTranscription,
  onEndCall, inviteLink,
}: ControlBarProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-surface/90 backdrop-blur border-t border-border flex-wrap">
      <CtrlBtn active={isMicOn} danger={!isMicOn} onClick={onToggleMic} title={isMicOn ? 'Выкл. микрофон' : 'Вкл. микрофон'}>
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </CtrlBtn>

      <CtrlBtn active={isCameraOn} onClick={onToggleCamera} title={isCameraOn ? 'Выкл. камеру' : 'Вкл. камеру'}>
        {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </CtrlBtn>

      <CtrlBtn active={!isScreenSharing} secondary={isScreenSharing} onClick={onToggleScreenShare} title={isScreenSharing ? 'Остановить экран' : 'Показать экран'}>
        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </CtrlBtn>

      <CtrlBtn active={!isChatOpen} accent={isChatOpen} onClick={onToggleChat} title="Чат">
        <MessageSquare className="w-5 h-5" />
      </CtrlBtn>

      <CtrlBtn active={!isTranscriptionOn} cyan={isTranscriptionOn} onClick={onToggleTranscription} title={isTranscriptionOn ? 'Выкл. транскрипцию' : 'Вкл. транскрипцию'}>
        <Subtitles className="w-5 h-5" />
      </CtrlBtn>

      <CtrlBtn active onClick={copyLink} title="Скопировать ссылку">
        {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
      </CtrlBtn>

      <button
        onClick={onEndCall}
        className="btn-danger w-12 h-12 rounded-2xl ml-2"
        title="Завершить звонок"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  )
}

function CtrlBtn({
  children, active, danger, secondary, accent, cyan, onClick, title,
}: {
  children: React.ReactNode
  active?: boolean
  danger?: boolean
  secondary?: boolean
  accent?: boolean
  cyan?: boolean
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all border',
        danger  && 'bg-danger/15 border-danger/40 text-danger',
        secondary && 'bg-secondary/15 border-secondary/40 text-secondary',
        accent && 'bg-accent/10 border-accent/40 text-accent',
        cyan   && 'bg-cyan/10 border-cyan/40 text-cyan',
        !danger && !secondary && !accent && !cyan && 'bg-surface-elevated border-border text-text hover:bg-surface-hover',
      )}
    >
      {children}
    </button>
  )
}
