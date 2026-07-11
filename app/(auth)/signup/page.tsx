'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/Button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
          <h1 className="text-2xl font-serif font-bold text-stone-900">Check your email</h1>
          <p className="text-sm text-stone-500 mt-3">
            We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-stone-900">
          VeloBrand.
        </Link>
        <h1 className="mt-6 text-2xl font-serif font-bold text-stone-900">Create your account</h1>
        <p className="text-sm text-stone-500 mt-1">Free, self-hosted or cloud. Bring your own AI keys.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={isLoading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-stone-500 text-center">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-stone-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
