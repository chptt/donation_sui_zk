import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  const [zkSession, setZkSessionState] = useState<ZkLoginSession | null>(null);

  useEffect(() => {
    const session = restoreZkLoginSession();
    if (session) setZkSessionState(session);
  }, []);

  const setZkSession = (session: ZkLoginSession | null) => {
    setZkSessionState(session);
  };

  const logout = () => {
    clearZkLoginSession();
    setZkSessionState(null);
  };

  return (
    <ZkLoginContext.Provider
      value={{
        zkSession,
        setZkSession,
        zkAddress: zkSession?.userAddress ?? null,
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
