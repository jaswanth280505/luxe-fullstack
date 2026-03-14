import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { consumePendingAccountType, getClerkInstance } from '../utils/clerkClient';

const AuthContext = createContext(null);
const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('luxe_user')); } catch { return null; }
  });
  const [clerkReady, setClerkReady] = useState(!hasClerk);

  const storeSession = useCallback((authResponse) => {
    const { token, ...userData } = authResponse;
    localStorage.setItem('luxe_token', token);
    localStorage.setItem('luxe_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const clearSession = useCallback((showToast = false) => {
    localStorage.removeItem('luxe_token');
    localStorage.removeItem('luxe_user');
    setUser(null);
    if (showToast) {
      toast.success('Logged out successfully');
    }
  }, []);

  const syncClerkSession = useCallback(async (requestedAccountType) => {
    const clerk = await getClerkInstance();
    if (!clerk?.session || !clerk.isSignedIn) {
      clearSession();
      return null;
    }

    const clerkToken = await clerk.session.getToken();
    if (!clerkToken) {
      clearSession();
      return null;
    }

    const res = await authApi.clerkExchange({ clerkToken, requestedAccountType });
    return storeSession(res.data);
  }, [clearSession, storeSession]);

  useEffect(() => {
    if (!hasClerk) {
      return undefined;
    }

    let active = true;
    let removeListener = null;
    let removeFocusListener = null;

    (async () => {
      try {
        const clerk = await getClerkInstance();
        if (!active) {
          return;
        }

        setClerkReady(true);

        const refresh = async () => {
          if (!active) {
            return;
          }

          if (clerk?.isSignedIn) {
            const requestedAccountType = !user ? consumePendingAccountType() : undefined;
            await syncClerkSession(requestedAccountType);
          } else {
            clearSession();
          }
        };

        await refresh();

        if (typeof clerk?.addListener === 'function') {
          removeListener = clerk.addListener(() => {
            refresh().catch(() => {});
          });
        }

        const handleFocus = () => {
          refresh().catch(() => {});
        };
        window.addEventListener('focus', handleFocus);
        removeFocusListener = () => window.removeEventListener('focus', handleFocus);
      } catch (error) {
        if (active) {
          setClerkReady(true);
        }
      }
    })();

    return () => {
      active = false;
      if (typeof removeListener === 'function') {
        removeListener();
      }
      if (typeof removeFocusListener === 'function') {
        removeFocusListener();
      }
    };
  }, [clearSession, syncClerkSession, user]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    return storeSession(res.data);
  }, [storeSession]);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    return storeSession(res.data);
  }, [storeSession]);

  const googleLogin = useCallback(async (credential) => {
    const res = await authApi.google({ credential });
    return storeSession(res.data);
  }, [storeSession]);

  const logout = useCallback(() => {
    if (hasClerk) {
      getClerkInstance()
        .then((clerk) => clerk?.signOut())
        .catch(() => {});
    }
    clearSession(true);
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        clerkEnabled: hasClerk,
        clerkReady,
        login,
        register,
        googleLogin,
        syncClerkSession,
        logout,
        isAdmin: user?.role === 'ADMIN',
        isSeller: user?.role === 'SELLER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
