import { signalTree } from '@signaltree/core';

import { SupabaseUser } from '../services/api/supabase.service';

export interface UserState {
  user: SupabaseUser | null;
  loading: boolean;
  error: string | null;
}

export const initialUserState: UserState = {
  user: null,
  loading: false,
  error: null,
};

export const userStore = signalTree(initialUserState);

export const userSelectors = {
  state: userStore.$,
  user: () => userStore.$.user(),
  loading: () => userStore.$.loading(),
  error: () => userStore.$.error(),
};

export function setUser(user: SupabaseUser | null) {
  userStore.$.user.set(user);
}

export function setLoading(isLoading: boolean) {
  userStore.$.loading.set(isLoading);
}

export function setError(message: string | null) {
  userStore.$.error.set(message);
}
