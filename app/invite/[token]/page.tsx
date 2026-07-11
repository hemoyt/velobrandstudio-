'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/Button';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept invite');
      router.push(`/teams/${data.teamId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
        <h1 className="text-2xl font-serif font-bold text-stone-900">Team invite</h1>

        {email === undefined && <p className="text-sm text-stone-400 mt-4">Loading...</p>}

        {email === null && (
          <>
            <p className="text-sm text-stone-500 mt-3 mb-6">Sign in or create an account to accept this invite.</p>
            <div className="flex flex-col gap-3">
              <Link href={`/login?next=/invite/${token}`}>
                <Button className="w-full">Sign in</Button>
              </Link>
              <Link href={`/signup?next=/invite/${token}`}>
                <Button variant="outline" className="w-full">
                  Create account
                </Button>
              </Link>
            </div>
          </>
        )}

        {email && (
          <>
            <p className="text-sm text-stone-500 mt-3 mb-6">
              Signed in as <strong>{email}</strong>. Accept this invite to join the team.
            </p>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <Button onClick={handleAccept} isLoading={isAccepting} className="w-full">
              Accept invite
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
