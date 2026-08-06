import { supabase, isSupabaseConfigured } from './supabase';
import { t } from '../i18n';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export async function signUpWithEmail(email: string, pass: string, name: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(t('auth.not_configured'));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, pass: string) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(t('auth.not_configured'));
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Lỗi đăng xuất:', error);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const u = data.user;
  return {
    id: u.id,
    email: u.email || '',
    name: u.user_metadata?.full_name || u.email?.split('@')[0] || t('auth.default_user_name'),
    avatarUrl: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
  };
}

export function onAuthChange(callback: (user: AuthUser | null, session: Session | null) => void) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const u = session.user;
      callback(
        {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || t('auth.default_user_name'),
          avatarUrl: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
        },
        session
      );
    } else {
      callback(null, null);
    }
  });

  return () => {
    subscription.subscription.unsubscribe();
  };
}
