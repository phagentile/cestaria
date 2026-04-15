import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserRole, MatchZoneRole } from '@/types';
import { db } from '@/lib/db';

interface AuthState {
  user: User | null;
  // Papel dinâmico do usuário no jogo atual (sobrepõe o role global)
  activeMatchRole: MatchZoneRole | null;
  activeMatchId: string | null;
  setUser: (user: User | null) => void;
  login: (userId: string) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (userId: string, newPassword: string) => Promise<void>;
  logout: () => void;
  // Resolve o papel do usuário para um jogo específico
  resolveMatchRole: (matchId: string) => Promise<void>;
  clearMatchRole: () => void;
  hasPermission: (permission: string) => boolean;
  // Retorna o clubId que este usuário gerencia no jogo atual (para team_managers)
  getManagedClubId: (homeClubId: string, awayClubId: string) => string | null;
}

const PERMISSIONS: Record<UserRole | MatchZoneRole, Set<string>> = {
  // Gestor — administrador completo do sistema
  gestor: new Set([
    'manage_master_data',
    'create_match',
    'operate_match',
    'control_clock',
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
    'control_clock',
    'approve_replacements',
    'manage_cards',
    'edit_score',
    'reopen_match',
    'view_audit',
    'export',
  ]),

  // Sideline Official Time A
  sideline_official_a: new Set([
    'operate_match',
    'approve_replacements',
    'manage_cards',
    'view_audit',
    'export',
  ]),

  // Sideline Official Time B
  sideline_official_b: new Set([
    'operate_match',
    'approve_replacements',
    'manage_cards',
    'view_audit',
    'export',
  ]),

  // Sideline Official que controla os dois lados
  sideline_official_both: new Set([
    'operate_match',
    'approve_replacements',
    'manage_cards',
    'view_audit',
    'export',
  ]),

  // Team Manager Time A
  team_manager_a: new Set([
    'request_replacements',
    'view_timeline',
    'export',
  ]),

  // Team Manager Time B
  team_manager_b: new Set([
    'request_replacements',
    'view_timeline',
    'export',
  ]),

  // Technical Zone Controller — Time A (supervisão zona técnica Time A)
  technical_zone_controller_a: new Set([
    'view_timeline',
    'export',
  ]),

  // Technical Zone Controller — Time B (supervisão zona técnica Time B)
  technical_zone_controller_b: new Set([
    'view_timeline',
    'export',
  ]),

  // Technical Zone Manager — genérico, somente leitura
  technical_zone_manager: new Set([
    'view_timeline',
    'export',
  ]),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeMatchRole: null,
      activeMatchId: null,

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

      logout: () => set({ user: null, activeMatchRole: null, activeMatchId: null }),

      resolveMatchRole: async (matchId: string) => {
        const { user } = get();
        if (!user) return;
        // Gestor não precisa de vínculo — tem acesso total sempre
        if (user.role === 'gestor') {
          set({ activeMatchId: matchId, activeMatchRole: null });
          return;
        }
        const entry = await db.matchZoneOfficials
          .where('matchId').equals(matchId)
          .filter((o) => o.userId === user.id)
          .first();
        set({
          activeMatchId: matchId,
          activeMatchRole: entry?.role ?? null,
        });
      },

      clearMatchRole: () => set({ activeMatchRole: null, activeMatchId: null }),

      hasPermission: (permission: string) => {
        const { user, activeMatchRole } = get();
        if (!user) return false;
        // Se há papel dinâmico no jogo atual, ele substitui o role global
        const effectiveRole = activeMatchRole ?? user.role;
        return PERMISSIONS[effectiveRole]?.has(permission) ?? false;
      },

      getManagedClubId: (homeClubId: string, awayClubId: string) => {
        const { user, activeMatchRole } = get();
        if (!user) return null;
        const role = activeMatchRole ?? user.role;
        if (role === 'team_manager_a') return homeClubId;
        if (role === 'team_manager_b') return awayClubId;
        return null;
      },
    }),
    {
      name: 'cestaria-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
