import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, isSubmitting, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ username, password });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card */}
      <div
        className="rounded-2xl border p-8 sm:p-10"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <ShieldCheck size={22} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Internal Access
            </p>
            <h1 className="text-xl font-semibold text-white">Admin Login</h1>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-slate-400">
              Username
            </label>
            <input
              className="admin-input"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                className="admin-input pr-11"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition-colors hover:text-slate-300"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error ? (
            <div
              className="rounded-xl px-4 py-3 text-[13px] text-red-300"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              {error}
            </div>
          ) : null}

          {/* Submit button */}
          <button
            className="group relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            }}
            type="submit"
            disabled={isSubmitting}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </span>
            {/* Hover shimmer overlay */}
            <div
              className="absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              }}
            />
          </button>
        </form>
      </div>

      {/* Bottom text */}
      <p className="mt-6 text-center text-[12px] text-slate-600">
        Protected admin area · Authorized personnel only
      </p>
    </div>
  );
}
