// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  userId: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  isAuthenticated: () => boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token: string) => {
        try {
          const decodedUser = jwtDecode<UserPayload>(token);
          set({ token, user: decodedUser });
        } catch (error) {
          console.error("Failed to decode token:", error);
          set({ token: null, user: null });
        }
      },
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

const initialToken = useAuthStore.getState().token;
if (initialToken) {
  useAuthStore.getState().login(initialToken);
}