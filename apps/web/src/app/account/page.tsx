'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { Video, LogOut, Plus, Clock, Users } from 'lucide-react'
import clsx from 'clsx'

interface RoomHistory {
  id: string
  slug: string
  title: string
  status: 'ACTIVE' | 'ENDED'
  createdAt: string
  endedAt?: string
  _count: { participants: number }
}

export default function AccountPage() {
  const router = useRouter()
  const { user, fetchMe, logout } = useAuthStore()
  const [rooms, setRooms] = useState<RoomHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMe().then(() => {
      api.get<RoomHistory[]>('/api/me/rooms')
        .then(setRooms)
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [fetchMe])

  useEffect(() => {
    if (!user && !loading) router.push('/login')
  }, [user, loading, router])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  async function createRoom() {
    const room = await api.post<{ id: string; slug: string }>('/api/rooms', { title: 'Новый звонок' })
    router.push(`/room/${room.slug}?lobby=true`)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Video className="w-4 h-4 text-bg" />
            </div>
            <span className="text-xl font-black text-accent">Звони</span>
          </button>
          <button onClick={handleLogout} className="btn-ghost px-3 py-2 text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>

        {/* Profile */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent border border-accent/30">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
            <button onClick={createRoom} className="btn-primary px-4 py-2 ml-auto text-sm">
              <Plus className="w-4 h-4" />
              Новый звонок
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="text-lg font-bold mb-4">История звонков</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-16" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-muted text-sm">Звонков пока нет</p>
              <button onClick={createRoom} className="btn-primary px-6 py-2.5 mt-4 text-sm">
                Создать первый звонок
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="card flex items-center gap-4 hover:border-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{room.title}</h4>
                      <span className={clsx('badge', room.status === 'ACTIVE' ? 'badge-green' : 'badge-muted')}>
                        {room.status === 'ACTIVE' ? 'Активен' : 'Завершён'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted">
                        {new Date(room.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Users className="w-3 h-3" />
                        {room._count.participants}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/room/${room.slug}${room.status === 'ACTIVE' ? '?lobby=true' : '/summary'}`)}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    {room.status === 'ACTIVE' ? 'Войти' : 'Итоги'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
