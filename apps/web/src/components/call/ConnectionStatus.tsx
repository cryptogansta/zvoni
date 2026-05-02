'use client'
import { ConnectionState } from 'livekit-client'
import { WifiOff, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

const STATUS_MAP = {
  [ConnectionState.Connecting]: { label: 'Подключение...', cls: 'text-accent', spin: true },
  [ConnectionState.Reconnecting]: { label: 'Переподключение...', cls: 'text-yellow-400', spin: true },
  [ConnectionState.SignalReconnecting]: { label: 'Восстановление сигнала...', cls: 'text-yellow-400', spin: true },
  [ConnectionState.Disconnected]: { label: 'Нет соединения', cls: 'text-danger', spin: false },
  [ConnectionState.Connected]: null,
}

export function ConnectionStatus({ state }: { state: ConnectionState }) {
  const info = STATUS_MAP[state]
  if (!info) return null

  const Icon = info.spin ? RefreshCw : WifiOff
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-full text-sm shadow-lg">
      <Icon className={clsx('w-4 h-4', info.cls, info.spin && 'animate-spin')} />
      <span>{info.label}</span>
    </div>
  )
}
