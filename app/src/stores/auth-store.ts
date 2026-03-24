import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { db } from '@/lib/db';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userId: string) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const PERMISSIONS: Record<UserRole, Set<string>> = {
  gestor: new Set([
    'manage_master_data',
    'create_match',
    'operate_match',
    'reopen_match',
    'manage_users',
    'view_audit',
    'export',
  ]),
  quarto_arbitro: new Set([
    'operate_match',
    'reopen_match',
    'export',
  ]),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      login: async (userId: string) => {
        const user = await db.users.get(userId);
        if (user) {
          set({ user });
          return true;
        }
        return false;
      },
      loginWithPassword: async (email: string, password: string) => {
        const user = await db.users.where('email').equals(email.trim().toLowerCase()).first();
        if (user && user.password === password) {
          set({ user });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        return PERMISSIONS[user.role]?.has(permission) ?? false;
      },
    }),
    {
      name: 'cestaria-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
