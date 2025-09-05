import { signalTree } from '@signaltree/core';

export interface UIState {
  sidebarOpen: boolean;
  toast: { message: string; type: 'info' | 'success' | 'error' } | null;
  modal: { name: string; open: boolean } | null;
}

export const initialUIState: UIState = {
  sidebarOpen: true,
  toast: null,
  modal: null,
};

export const uiStore = signalTree(initialUIState);

export const uiSelectors = {
  state: uiStore.$,
  sidebarOpen: () => uiStore.$.sidebarOpen(),
  toast: () => uiStore.$.toast(),
  modal: () => uiStore.$.modal(),
};

export function setSidebarOpen(open: boolean) {
  uiStore.$.sidebarOpen.set(open);
}

export function showToast(
  message: string,
  type: 'info' | 'success' | 'error' = 'info'
) {
  uiStore.$.toast.set({ message, type });
}

export function clearToast() {
  uiStore.$.toast.set(null);
}

export function openModal(name: string) {
  uiStore.$.modal.set({ name, open: true });
}

export function closeModal() {
  uiStore.$.modal.set(null);
}
