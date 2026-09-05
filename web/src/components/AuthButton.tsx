import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, Mail, X } from 'lucide-react';

interface AuthButtonProps {
  configured: boolean;
  loading: boolean;
  email?: string;
  onSendMagicLink: (email: string) => Promise<{ error?: string }>;
  onSignOut: () => Promise<void>;
}

export function AuthButton({ configured, loading, email, onSendMagicLink, onSignOut }: AuthButtonProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!configured) {
    return <span className="text-xs text-slate-500">Modo local</span>;
  }

  if (email) {
    return (
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-rose-300 transition-colors"
        title={`Sair de ${email}`}
      >
        <LogOut className="w-3.5 h-3.5" />
        Sair
      </button>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await onSendMagicLink(input.trim());
    setMessage(error ?? 'Confira seu e-mail para entrar.');
    setSubmitting(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => { setOpen((value) => !value); setMessage(null); }}
        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        Entrar para salvar
      </button>
      {open && (
        <form onSubmit={submit} className="absolute z-20 right-0 bottom-8 w-72 rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-2xl">
          <button type="button" onClick={() => setOpen(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <label className="block text-xs font-semibold text-slate-200 mb-2">Receba um link de acesso</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute w-3.5 h-3.5 left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input required type="email" value={input} onChange={(event) => setInput(event.target.value)} placeholder="voce@email.com" className="w-full rounded-lg bg-slate-900 border border-slate-700 pl-8 pr-2 py-2 text-xs outline-none focus:border-amber-400" />
            </div>
            <button disabled={submitting} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Enviar</button>
          </div>
          {message && <p className="mt-2 text-[11px] text-slate-400">{message}</p>}
        </form>
      )}
    </div>
  );
}
