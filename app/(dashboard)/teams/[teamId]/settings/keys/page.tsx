import { ProviderKeysSettings } from '@/components/team/ProviderKeysSettings';

export default async function ProviderKeysPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;

  return (
    <div className="p-8 lg:p-12">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">AI provider keys</h1>
      <p className="text-stone-500 text-sm mb-10 max-w-2xl">
        VeloBrand Studio is bring-your-own-key: this team pays for its own AI usage directly with OpenAI and Google,
        and keys are encrypted at rest. Nothing is billed centrally.
      </p>
      <ProviderKeysSettings teamId={teamId} />
    </div>
  );
}
