import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NavLockContextValue {
  isNavLocked: boolean;
  setNavLock: (locked: boolean) => void;
  toggleNavLock: () => void;
}

const NavLockContext = createContext<NavLockContextValue | undefined>(undefined);

export const NavLockProvider: React.FC<{ children: React.ReactNode } > = ({ children }) => {
  const [isNavLocked, setIsNavLocked] = useState<boolean>(false);

  const setNavLock = useCallback((locked: boolean) => setIsNavLocked(locked), []);
  const toggleNavLock = useCallback(() => setIsNavLocked(prev => !prev), []);

  // Global Space hotkey toggles nav lock
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (event.code === 'Space' && !inInput) {
        event.preventDefault();
        toggleNavLock();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleNavLock]);

  const value: NavLockContextValue = {
    isNavLocked,
    setNavLock,
    toggleNavLock,
  };

  return (
    <NavLockContext.Provider value={value}>{children}</NavLockContext.Provider>
  );
};

export const useNavLock = (): NavLockContextValue => {
  const ctx = useContext(NavLockContext);
  if (!ctx) throw new Error('useNavLock must be used within a NavLockProvider');
  return ctx;
};
