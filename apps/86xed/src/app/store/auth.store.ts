import { signalTree } from '@signaltree/core';

// Export auth types for reuse across components
export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
  fullName?: string;
}

export interface AuthError {
  field?: keyof AuthFormData;
  message: string;
  type: 'validation' | 'network' | 'auth' | 'server';
}

export type SocialProvider = 'google' | 'github' | 'discord';

// Simple flattened auth state (compatible with SignalTree)
export interface AuthState {
  // Loading states
  isLoginLoading: boolean;
  isRegisterLoading: boolean;
  isPasswordResetLoading: boolean;

  // Error states
  loginError: string | null;
  registerError: string | null;
  passwordResetError: string | null;

  // Success states
  loginSuccess: boolean;
  registerSuccess: boolean;
  passwordResetSent: boolean;

  // Social auth
  socialAuthLoading: SocialProvider | null;
  socialAuthError: string | null;
}

// Create auth SignalTree store with flat structure (compatible with SignalTree)
const authStore = signalTree<AuthState>({
  // Loading states
  isLoginLoading: false,
  isRegisterLoading: false,
  isPasswordResetLoading: false,

  // Error states  
  loginError: null,
  registerError: null,
  passwordResetError: null,

  // Success states
  loginSuccess: false,
  registerSuccess: false,
  passwordResetSent: false,

  // Social auth
  socialAuthLoading: null,
  socialAuthError: null,
});

// Export store with direct signal access and computed selectors
export const authStoreExports = {
  // Direct state signals (leaves are already Angular signals)
  isLoginLoading: authStore.$.isLoginLoading,
  isRegisterLoading: authStore.$.isRegisterLoading,
  isPasswordResetLoading: authStore.$.isPasswordResetLoading,
  
  loginError: authStore.$.loginError,
  registerError: authStore.$.registerError,
  passwordResetError: authStore.$.passwordResetError,
  
  loginSuccess: authStore.$.loginSuccess,
  registerSuccess: authStore.$.registerSuccess,
  passwordResetSent: authStore.$.passwordResetSent,
  
  socialAuthLoading: authStore.$.socialAuthLoading,
  socialAuthError: authStore.$.socialAuthError,

  // Computed selectors using functions (not computed() wrapper)
  hasAnyError: (): boolean => {
    return !!(authStore.$.loginError() || 
              authStore.$.registerError() || 
              authStore.$.passwordResetError() ||
              authStore.$.socialAuthError());
  },

  isAnyLoading: (): boolean => {
    return authStore.$.isLoginLoading() || 
           authStore.$.isRegisterLoading() || 
           authStore.$.isPasswordResetLoading() ||
           !!authStore.$.socialAuthLoading();
  },

  // Actions for updating state
  setLoginLoading: (loading: boolean) => {
    authStore.$.isLoginLoading.set(loading);
  },

  setRegisterLoading: (loading: boolean) => {
    authStore.$.isRegisterLoading.set(loading);
  },

  setPasswordResetLoading: (loading: boolean) => {
    authStore.$.isPasswordResetLoading.set(loading);
  },

  setLoginError: (error: string | null) => {
    authStore.$.loginError.set(error);
  },

  setRegisterError: (error: string | null) => {
    authStore.$.registerError.set(error);
  },

  setPasswordResetError: (error: string | null) => {
    authStore.$.passwordResetError.set(error);
  },

  setLoginSuccess: (success: boolean) => {
    authStore.$.loginSuccess.set(success);
  },

  setRegisterSuccess: (success: boolean) => {
    authStore.$.registerSuccess.set(success);
  },

  setPasswordResetSent: (sent: boolean) => {
    authStore.$.passwordResetSent.set(sent);
  },

  setSocialAuthLoading: (provider: SocialProvider | null) => {
    authStore.$.socialAuthLoading.set(provider);
  },

  setSocialAuthError: (error: string | null) => {
    authStore.$.socialAuthError.set(error);
  },

  // Clear all errors
  clearAllErrors: () => {
    authStore.$.loginError.set(null);
    authStore.$.registerError.set(null);
    authStore.$.passwordResetError.set(null);
    authStore.$.socialAuthError.set(null);
  },

  // Reset all states
  reset: () => {
    authStore.$.isLoginLoading.set(false);
    authStore.$.isRegisterLoading.set(false);
    authStore.$.isPasswordResetLoading.set(false);
    authStore.$.loginError.set(null);
    authStore.$.registerError.set(null);
    authStore.$.passwordResetError.set(null);
    authStore.$.loginSuccess.set(false);
    authStore.$.registerSuccess.set(false);
    authStore.$.passwordResetSent.set(false);
    authStore.$.socialAuthLoading.set(null);
    authStore.$.socialAuthError.set(null);
  },
};

export default authStoreExports;
