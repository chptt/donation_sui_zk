import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { ZkLoginSession, restoreZkLoginSession, clearZkLoginSession } from "./zkLogin";

interface ZkLoginContextType {
  zkSession: ZkLoginSession | null;
  setZkSession: (session: ZkLoginSession | null) => void;
  zkAddress: string | null;
  logout: () => void;
}

const ZkLoginContext = createContext<ZkLoginContextType>({
  zkSession: null,
  setZkSession: () => {},
  zkAddress: null,
  logout: () => {},
});

export function ZkLoginProvider({ children }: { children: ReactNode }) {
  // Keep session in a ref so the keypair object is never re-serialized/deserialized
  const sessionRef = useRef<ZkLoginSession | null>(null);
  const [zkAddress, setZkAddress] = useState<string | null>(null);

  useEffect(() => {
    // On mount, try to restore from sessionStorage (page refresh case)
    const session = restoreZkLoginSession();
    if (session) {
      sessionRef.current = session;
      setZkAddress(session.userAddress);
    }
  }, []);

  const setZkSession = (session: ZkLoginSession | null) => {
    sessionRef.current = session;
    setZkAddress(session?.userAddress ?? null);
  };

  const logout = () => {
    clearZkLoginSession();
    sessionRef.current = null;
    setZkAddress(null);
  };

  return (
    <ZkLoginContext.Provider
      value={{
        get zkSession() { return sessionRef.current; },
        setZkSession,
        zkAddress,
        logout,
      }}
    >
      {children}
    </ZkLoginContext.Provider>
  );
}

export function useZkLogin() {
  return useContext(ZkLoginContext);
}
