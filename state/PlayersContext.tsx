import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Player } from '../types';
import { INITIAL_PLAYERS } from '../constants';
import { Vector3 } from 'three';

interface PlayersContextValue {
  players: Player[];
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  updatePlayerPosition: (id: string, position: Vector3) => void;
}

const PlayersContext = createContext<PlayersContextValue | undefined>(undefined);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const updatePlayerPosition = useCallback((id: string, position: Vector3) => {
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, position } : p)));
  }, []);

  const value = useMemo<PlayersContextValue>(() => ({
    players,
    selectedPlayerId,
    setSelectedPlayerId,
    updatePlayer,
    updatePlayerPosition,
  }), [players, selectedPlayerId, updatePlayer, updatePlayerPosition]);

  return <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>;
};

export const usePlayers = (): PlayersContextValue => {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used within a PlayersProvider');
  return ctx;
};
