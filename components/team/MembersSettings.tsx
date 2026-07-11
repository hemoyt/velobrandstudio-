'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import type { TeamRole } from '@/lib/supabase/database.types';

interface Member {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile: { email: string; display_name: string | null } | null;
}

interface Invite {
  id: string;
  email: string;
  role: TeamRole;
  expires_at: string;
}

const ROLES: TeamRole[] = ['viewer', 'editor', 'admin', 'owner'];
const INVITABLE_ROLES: TeamRole[] = ['viewer', 'editor', 'admin'];

export function MembersSettings({ teamId, currentUserId }: { teamId: string; currentUserId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const refresh = async () => {
    const [membersRes, invitesRes] = await Promise.all([
      fetch(`/api/teams/${teamId}/members`).then((r) => r.json()),
      fetch(`/api/teams/${teamId}/invites`).then((r) => r.json()),
    ]);
    setMembers(membersRes.members ?? []);
    setInvites(invitesRes.invites ?? []);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    setLastInviteUrl(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');
      setEmail('');
      setLastInviteUrl(data.inviteUrl);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: TeamRole) => {
    await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    await refresh();
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
    await refresh();
  };

  const handleRevoke = async (inviteId: string) => {
    await fetch(`/api/teams/${teamId}/invites/${inviteId}`, { method: 'DELETE' });
    await refresh();
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">Invite a teammate</h2>
      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 mb-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as TeamRole)}
          className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white"
        >
          {INVITABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button type="submit" isLoading={isLoading}>
          Send invite
        </Button>
      </form>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {lastInviteUrl && (
        <p className="text-xs text-stone-500 mb-6 bg-stone-100 p-3 rounded-lg break-all">
          Invite link (email delivery depends on your RESEND_API_KEY config):{' '}
          <span className="font-mono">{lastInviteUrl}</span>
        </p>
      )}

      {invites.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Pending invites</h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100">
                <div>
                  <p className="text-sm font-medium text-stone-800">{invite.email}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wide">{invite.role}</p>
                </div>
                <button onClick={() => handleRevoke(invite.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">Members</h2>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl">
            <div>
              <p className="text-sm font-medium text-stone-800">
                {member.profile?.email ?? member.user_id}
                {member.user_id === currentUserId && <span className="text-stone-400"> (you)</span>}
              </p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {member.role === 'owner' ? (
                <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-bold uppercase">owner</span>
              ) : (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as TeamRole)}
                    className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                  >
                    {ROLES.filter((r) => r !== 'owner').map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleRemove(member.user_id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
