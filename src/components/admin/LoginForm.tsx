import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import GlassEffect from '../GlassEffect';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenziali non valide o errore di rete.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-white drop-shadow-md tracking-wider">AREA ADMIN</h1>
        <div className="h-1 w-16 bg-blue-500 mx-auto mt-4 rounded-full"></div>
      </div>
      
      <GlassEffect className="w-full max-w-sm p-10 md:p-12 rounded-[28px]">
        {error && <div className="bg-red-500/20 text-red-200 p-4 rounded-xl mb-8 text-sm text-center border border-red-500/30 font-medium">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500/50 focus:bg-[rgba(0,0,0,0.4)] transition-all"
              placeholder="admin@thecage.it"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[rgba(0,0,0,0.2)] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500/50 focus:bg-[rgba(0,0,0,0.4)] transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="install-btn mt-6 w-full justify-center py-4 disabled:opacity-50 disabled:cursor-not-allowed text-[0.95rem]"
          >
            {loading ? 'Accesso in corso...' : 'Entra nel Pannello'}
          </button>
        </form>
      </GlassEffect>
    </div>
  );
}
