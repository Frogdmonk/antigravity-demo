import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, AlertCircle, ArrowRight, Loader2, Info } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, isConfigured } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password, displayName)
        if (error) {
          setError(error.message)
        } else {
          setSignupSuccess(true)
        }
      } else {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setError(error.message)
        } else {
          navigate('/')
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected authentication error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsGoogleSubmitting(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 sm:p-8 text-card-foreground shadow-xl transition-all">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === 'login'
            ? 'Sign in to access your saved conversations'
            : 'Get started with Gemini Chat AI Assistant'}
        </p>
      </div>

      {/* Supabase Not Configured Warning */}
      {!isConfigured && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>Supabase Setup Required</span>
          </div>
          <p className="leading-relaxed">
            Please add your <code className="rounded bg-amber-500/20 px-1 py-0.5">VITE_SUPABASE_URL</code> and <code className="rounded bg-amber-500/20 px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code> to your <code className="rounded bg-amber-500/20 px-1 py-0.5">.env</code> file.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mt-4 flex items-center space-x-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Signup Success Notice */}
      {signupSuccess ? (
        <div className="mt-6 space-y-4 text-center">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300">
            <p className="font-semibold">Account created successfully!</p>
            <p className="mt-1">
              If email confirmation is enabled on your Supabase project, check your inbox to confirm your email before signing in.
            </p>
          </div>
          <Button
            variant="default"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </Button>
        </div>
      ) : (
        <>
          {/* Google OAuth Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="flex h-10 w-full items-center justify-center space-x-3 rounded-xl border border-border bg-background px-4 text-xs font-medium text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all disabled:opacity-50"
            >
              {isGoogleSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground select-none">
              Or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Display Name
                </label>
                <Input
                  type="text"
                  placeholder="Alex Rivers"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button
              type="submit"
              variant="default"
              className="mt-2 w-full justify-center space-x-2 h-10 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Switch link */}
          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Sign up
                </Link>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
