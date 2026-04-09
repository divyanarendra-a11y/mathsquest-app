import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../lib/api';
import { useStore } from '../store/useStore';

export function Login() {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.name, form.email, form.password);
      setAuth(res.data.token, res.data.user.id, res.data.user.name);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-2xl"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🗺️</div>
          <h1 className="font-display text-3xl text-white">MathsQuest</h1>
          <p className="text-gray-400 text-sm mt-1">Year 7 Maths Adventure</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === m ? 'bg-mq-purple text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setMode(m)}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-mq-purple placeholder-gray-500"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          )}
          <input
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-mq-purple placeholder-gray-500"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-mq-purple placeholder-gray-500"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-mq-purple hover:bg-purple-600 disabled:bg-gray-700 text-white font-display text-lg rounded-xl transition-colors"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
