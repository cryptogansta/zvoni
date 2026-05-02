'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, LogIn, Plus, Zap, Shield, Users } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const { user, fetchMe } = useAuthStore()
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchMe() }, [fetchMe])

  async function handleCreateRoom() {
    setCreating(true)
    try {
      if (!user) {
        router.push('/login?next=create')
        return
      }
      const room = await api.post<{ id: string; slug: string }>('/api/rooms', { title: 'Новый звонок' })
      router.push(`/room/${room.slug}?lobby=true`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка'
      alert(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Video className="w-4 h-4 text-bg" />
          </div>
          <span className="text-xl font-bold tracking-tight glow-text-accent text-accent">Звони</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">{user.name}</span>
              <button onClick={() => router.push('/account')} className="btn-secondary px-4 py-2 text-sm">
                Аккаунт
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => router.push('/login')} className="btn-ghost px-4 py-2 text-sm">
                Войти
              </button>
              <button onClick={() => router.push('/register')} className="btn-secondary px-4 py-2 text-sm">
                Регистрация
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Быстро. Просто. Надёжно.
          </div>

          <h1 className="text-6xl font-black tracking-tight mb-4">
            <span className="text-text">Видеозвонки</span>
            <br />
            <span className="text-accent glow-text-accent">без лишнего шума</span>
          </h1>

          <p className="text-xl text-muted mb-10 leading-relaxed">
            Создай звонок за секунду. Отправь ссылку. Поговори.
            <br />
            Работает в браузере без установки.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="btn-primary px-8 py-4 text-lg"
            >
              <Plus className="w-5 h-5" />
              {creating ? 'Создаём...' : 'Создать звонок'}
            </button>
            {!user && (
              <button onClick={() => router.push('/login')} className="btn-secondary px-8 py-4 text-lg">
                <LogIn className="w-5 h-5" />
                Войти
              </button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            { icon: Zap, title: 'Мгновенное подключение', desc: 'Ссылка — и вы уже в звонке. Без аккаунта.' },
            { icon: Shield, title: 'Работает без VPN', desc: 'Сервер в России. Никаких блокировок.' },
            { icon: Users, title: 'До 10 участников', desc: 'Групповые звонки с адаптивным качеством видео.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-center text-sm text-muted">
        © 2024 Звони
      </footer>
    </div>
  )
}
