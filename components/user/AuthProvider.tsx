'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getApi, isError, reDefine, hasActiveSession, syncTokens } from '@/lib/oneentry';
import { logout as logoutAction } from '@/app/actions/auth';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';

type AuthState = {
  isAuth: boolean;
  loading: boolean;
  user: IUserEntity | null;
  login: (accessToken: string, refreshToken: string, providerMarker: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUserEntity | null>(null);
  const initRef = useRef(false);

  const fetchUser = useCallback(async () => {
    const result = await getApi().Users.getUser();
    if (isError(result)) {
      if (result.statusCode === 401 || result.statusCode === 403) {
        localStorage.removeItem('refresh-token');
        setIsAuth(false);
        setUser(null);
      }
      return;
    }
    setUser(result as IUserEntity);
    setIsAuth(true);
  }, []);

  const login = useCallback(
    async (accessToken: string, refreshToken: string, providerMarker: string) => {
      localStorage.setItem('refresh-token', refreshToken);
      localStorage.setItem('authProviderMarker', providerMarker);
      syncTokens(accessToken, refreshToken);
      await fetchUser();
    },
    [fetchUser],
  );

  const logout = useCallback(async () => {
    const marker = localStorage.getItem('authProviderMarker') || 'email';
    const token = localStorage.getItem('refresh-token') || '';
    if (token) await logoutAction(marker, token);
    localStorage.removeItem('refresh-token');
    localStorage.removeItem('authProviderMarker');
    setIsAuth(false);
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh-token') : null;
      if (!refresh) {
        setLoading(false);
        return;
      }
      if (!hasActiveSession()) {
        await reDefine(refresh);
      }
      await fetchUser();
      setLoading(false);
    };

    init();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ isAuth, loading, user, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
