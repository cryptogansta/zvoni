'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Video, Plus, CheckSquare, HelpCircle, FileText, Zap } from 'lucide-react'

interface SummaryData {
  summaryId: string
  isMock: boolean
  summary: string | null
  decisions: string | null
  actionItems: string | null
  questions: string | null
}

export default function SummaryPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<SummaryData>(`/api/rooms/${roomId}/summary`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roomId])

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Video className="w-4 h-4 text-bg" />
          </div>
          <span className="text-xl font-black text-accent">Звони</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Звонок завершён</h1>
        <p className="text-muted mb-8">Итоги встречи</p>

        {loading ? (
          <div className="card animate-pulse h-40" />
        ) : data?.isMock ? (
          <div className="card border-accent/20 bg-accent/5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="font-semibold text-accent">AI-итоги</span>
              <span className="badge-muted ml-auto">Mock</span>
            </div>
            <p className="text-sm text-muted">
              Для получения транскрипции и краткого изложения встречи подключите AI-провайдер
              (Whisper, Deepgram, OpenAI, Yandex SpeechKit) в настройках бэкенда.
            </p>
          </div>
        ) : data && (
          <div className="space-y-4 mb-6">
            {data.summary && (
              <SummarySection icon={<FileText className="w-4 h-4" />} title="Краткое изложение" content={data.summary} />
            )}
            {data.decisions && (
              <SummarySection icon={<CheckSquare className="w-4 h-4" />} title="Что решили" content={data.decisions} />
            )}
            {data.actionItems && (
              <SummarySection icon={<Plus className="w-4 h-4" />} title="Следующие шаги" content={data.actionItems} />
            )}
            {data.questions && (
              <SummarySection icon={<HelpCircle className="w-4 h-4" />} title="Открытые вопросы" content={data.questions} />
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => router.push('/')} className="btn-primary px-6 py-3">
            <Plus className="w-4 h-4" />
            Новый звонок
          </button>
          <button onClick={() => router.push('/account')} className="btn-secondary px-6 py-3">
            История звонков
          </button>
        </div>
      </div>
    </div>
  )
}

function SummarySection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-accent mb-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-sm text-muted whitespace-pre-wrap">{content}</p>
    </div>
  )
}
