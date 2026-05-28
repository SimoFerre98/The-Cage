import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';

export default function AdminApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh] text-white/60">Caricamento...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      {!session ? <LoginForm /> : <Dashboard />}
    </div>
  );
}
