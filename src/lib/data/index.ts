import type { DataAdapter } from './ports';
import { createMockAdapter } from './mock/MockAdapter';
import { createSupabaseAdapter } from './supa/SupabaseAdapter';

export * from './types';
export * from './ports';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

export const dataAdapter: DataAdapter = USE_SUPABASE
  ? createSupabaseAdapter()
  : createMockAdapter();

export const isMockMode = !USE_SUPABASE;
