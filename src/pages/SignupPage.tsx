import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/auth/AuthForm'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function SignupPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-background">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <AuthForm mode="signup" />
    </div>
  )
}
