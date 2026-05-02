'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Video, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { ApiError } from '@/lib/api'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      const next = params.get('next')
      if (next === 'create') {
        const { api } = await import('@/lib/api')
        const room = await api.post<{ id: string; slug: string }>('/api/rooms', { title: 'Новый звонок' })
        router.push(`/room/${room.slug}?lobby=true`)
      } else {
        router.push('/')
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка входа')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Video className="w-5 h-5 text-bg" />
          </div>
          <span className="text-2xl font-black text-accent glow-text-accent">Звони</span>
        </div>

        <div className="card">
          <h1 className="text-xl font-bold mb-6">Войти в аккаунт</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm card h-64 animate-pulse" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
