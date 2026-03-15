import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Confederation,
  Federation,
  Club,
  Referee,
  Category,
  GameType,
  User,
} from '@/types';
import { db } from '@/lib/db';

interface AdminState {
  confederations: Confederation[];
  federations: Federation[];
  clubs: Club[];
  referees: Referee[];
  categories: Category[];
  gameTypes: GameType[];
  users: User[];

  loadAll: () => Promise<void>;

  // Confederations
  addConfederation: (data: Omit<Confederation, 'id'>) => Promise<string>;
  updateConfederation: (id: string, data: Partial<Confederation>) => Promise<void>;
  deleteConfederation: (id: string) => Promise<void>;

  // Federations
  addFederation: (data: Omit<Federation, 'id'>) => Promise<string>;
  updateFederation: (id: string, data: Partial<Federation>) => Promise<void>;
  deleteFederation: (id: string) => Promise<void>;

  // Clubs
  addClub: (data: Omit<Club, 'id'>) => Promise<string>;
  updateClub: (id: string, data: Partial<Club>) => Promise<void>;
  deleteClub: (id: string) => Promise<void>;

  // Referees
  addReferee: (data: Omit<Referee, 'id'>) => Promise<string>;
  updateReferee: (id: string, data: Partial<Referee>) => Promise<void>;
  deleteReferee: (id: string) => Promise<void>;

  // Categories
  addCategory: (data: Omit<Category, 'id'>) => Promise<string>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Users
  addUser: (data: Omit<User, 'id'>) => Promise<string>;
  deleteUser: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  confederations: [],
  federations: [],
  clubs: [],
  referees: [],
  categories: [],
  gameTypes: [],
  users: [],

  loadAll: async () => {
    const [confederations, federations, clubs, referees, categories, gameTypes, users] =
      await Promise.all([
        db.confederations.toArray(),
        db.federations.toArray(),
        db.clubs.toArray(),
        db.referees.toArray(),
        db.categories.toArray(),
        db.gameTypes.toArray(),
        db.users.toArray(),
      ]);
    set({ confederations, federations, clubs, referees, categories, gameTypes, users });
  },

  // Confederations
  addConfederation: async (data) => {
    const id = uuid();
    const entry = { ...data, id };
    await db.confederations.add(entry);
    set((s) => ({ confederations: [...s.confederations, entry] }));
    return id;
  },
  updateConfederation: async (id, data) => {
    await db.confederations.update(id, data);
    set((s) => ({
      confederations: s.confederations.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },
  deleteConfederation: async (id) => {
    await db.confederations.delete(id);
    set((s) => ({ confederations: s.confederations.filter(c => c.id !== id) }));
  },

  // Federations
  addFederation: async (data) => {
    const id = uuid();
    const entry = { ...data, id };
    await db.federations.add(entry);
    set((s) => ({ federations: [...s.federations, entry] }));
    return id;
  },
  updateFederation: async (id, data) => {
    await db.federations.update(id, data);
    set((s) => ({
      federations: s.federations.map(f => f.id === id ? { ...f, ...data } : f),
    }));
  },
  deleteFederation: async (id) => {
    await db.federations.delete(id);
    set((s) => ({ federations: s.federations.filter(f => f.id !== id) }));
  },

  // Clubs
  addClub: async (data) => {
    const id = uuid();
    const entry = { ...data, id };
    await db.clubs.add(entry);
    set((s) => ({ clubs: [...s.clubs, entry] }));
    return id;
  },
  updateClub: async (id, data) => {
    await db.clubs.update(id, data);
    set((s) => ({
      clubs: s.clubs.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },
  deleteClub: async (id) => {
    await db.clubs.delete(id);
    set((s) => ({ clubs: s.clubs.filter(c => c.id !== id) }));
  },

  // Referees
  addReferee: async (data) => {
    const id = uuid();
    const entry = { ...data, id };
    await db.referees.add(entry);
    set((s) => ({ referees: [...s.referees, entry] }));
    return id;
  },
  updateReferee: async (id, data) => {
    await db.referees.update(id, data);
    set((s) => ({
      referees: s.referees.map(r => r.id === id ? { ...r, ...data } : r),
    }));
  },
  deleteReferee: async (id) => {
    await db.referees.delete(id);
    set((s) => ({ referees: s.referees.filter(r => r.id !== id) }));
  },

  // Categories
  addCategory: async (data) => {
    const id = uuid();
    const entry = { ...data, id };
    await db.categories.add(entry);
    set((s) => ({ categories: [...s.categories, entry] }));
    return id;
  },
  updateCategory: async (id, data) => {
    await db.categories.update(id, data);
    set((s) => ({
      categories: s.categories.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },
  deleteCategory: async (id) => {
    await db.categories.delete(id);
    set((s) => ({ categories: s.categories.filter(c => c.id !== id) }));
  },

  // Users
  addUser: async (data) => {
    const id = uuid();
    const entry = { ...data, id };
    await db.users.add(entry);
    set((s) => ({ users: [...s.users, entry] }));
    return id;
  },
  deleteUser: async (id) => {
    await db.users.delete(id);
    set((s) => ({ users: s.users.filter(u => u.id !== id) }));
  },
}));
