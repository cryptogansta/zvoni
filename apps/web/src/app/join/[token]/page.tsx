'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Video } from 'lucide-react'
import { api } from '@/lib/api'

export default function JoinTokenPage() {
  const router = useRouter()
  const { token } = useParams<{ token: string }>()

  useEffect(() => {
    api.get<{ roomSlug: string }>(`/api/join/${token}`)
      .then((data) => router.replace(`/room/${data.roomSlug}?lobby=true&guest=true`))
      .catch(() => router.replace('/?error=link_expired'))
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Video className="w-7 h-7 text-bg" />
        </div>
        <p className="text-muted">Переходим к звонку...</p>
      </div>
    </div>
  )
}
