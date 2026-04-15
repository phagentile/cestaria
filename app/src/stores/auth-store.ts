import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { db } from '@/lib/db';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userId: string) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<string | null>; // returns new temp password or null if not found
  updatePassword: (userId: string, newPassword: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const PERMISSIONS: Record<UserRole, Set<string>> = {
  // Gestor — administrador completo do sistema
  gestor: new Set([
    'manage_master_data',
    'create_match',
    'operate_match',
    'control_clock',       // start/stop relógio mestre
    'approve_replacements',
    'request_replacements',
    'manage_cards',
    'edit_score',
    'reopen_match',
    'manage_users',
    'view_audit',
    'export',
  ]),

  // 4º Árbitro — relógio mestre, cartões, aprovação de subs
  quarto_arbitro: new Set([
    'operate_match',
    'control_clock',       // start/stop relógio mestre
    'approve_replacements',
    'manage_cards',
    'edit_score',
    'reopen_match',
    'view_audit',
    'export',
  ]),

  // Sideline Official Time A — aprova subs, cartões, vê Time A
  sideline_official_a: new Set([
    'operate_match',
    'approve_replacements',
    'manage_cards',
    'view_audit',
    'export',
  ]),

  // Sideline Official Time B — idêntico ao A mas vinculado ao Time B
  sideline_official_b: new Set([
    'operate_match',
    'approve_replacements',
    'manage_cards',
    'view_audit',
    'export',
  ]),

  // Team Manager Time A — solicita substituições do Time A
  team_manager_a: new Set([
    'request_replacements',
    'view_timeline',
    'export',
  ]),

  // Team Manager Time B — solicita substituições do Time B
  team_manager_b: new Set([
    'request_replacements',
    'view_timeline',
    'export',
  ]),

  // Technical Zone Manager — somente leitura operacional
  technical_zone_manager: new Set([
    'view_timeline',
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
      resetPassword: async (email: string) => {
        const user = await db.users.where('email').equals(email.trim().toLowerCase()).first();
        if (!user) return null;
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const newPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        await db.users.update(user.id, { password: newPassword });
        return newPassword;
      },
      updatePassword: async (userId: string, newPassword: string) => {
        await db.users.update(userId, { password: newPassword });
        const updated = await db.users.get(userId);
        if (updated) set({ user: updated });
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
