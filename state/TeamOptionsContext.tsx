import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TeamOptions } from '../types';

interface TeamOptionsContextValue {
  teamAOptions: TeamOptions;
  teamBOptions: TeamOptions;
  setTeamOptionChange: (team: 'A' | 'B', updates: Partial<TeamOptions>) => void;
  togglePlayerSelection: (team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => void;
}

const TeamOptionsContext = createContext<TeamOptionsContextValue | undefined>(undefined);

const defaultTeamOptions = (color: string): TeamOptions => ({
  color,
  showPassingNet: false,
  passingNetPlayerIds: [],
  showCoveredArea: false,
  coveredAreaPlayerIds: [],
  showPlayerNames: true,
  showPlayerRoles: true,
  showPlayerNumbers: true,
});

export const TeamOptionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teamAOptions, setTeamAOptions] = useState<TeamOptions>(defaultTeamOptions('#3b82f6'));
  const [teamBOptions, setTeamBOptions] = useState<TeamOptions>(defaultTeamOptions('#ef4444'));

  const setTeamOptionChange = useCallback((team: 'A' | 'B', updates: Partial<TeamOptions>) => {
    const setter = team === 'A' ? setTeamAOptions : setTeamBOptions;
    setter(prev => ({ ...prev, ...updates }));
  }, []);

  const togglePlayerSelection = useCallback((team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => {
    const setter = team === 'A' ? setTeamAOptions : setTeamBOptions;
    const key = feature === 'passingNet' ? 'passingNetPlayerIds' : 'coveredAreaPlayerIds';
    setter(prev => {
      const currentIds = prev[key];
      const newIds = currentIds.includes(playerId)
        ? currentIds.filter(id => id !== playerId)
        : [...currentIds, playerId];
      return { ...prev, [key]: newIds } as TeamOptions;
    });
  }, []);

  const value = useMemo<TeamOptionsContextValue>(() => ({
    teamAOptions,
    teamBOptions,
    setTeamOptionChange,
    togglePlayerSelection,
  }), [teamAOptions, teamBOptions, setTeamOptionChange, togglePlayerSelection]);

  return (
    <TeamOptionsContext.Provider value={value}>{children}</TeamOptionsContext.Provider>
  );
};

export const useTeamOptions = (): TeamOptionsContextValue => {
  const ctx = useContext(TeamOptionsContext);
  if (!ctx) throw new Error('useTeamOptions must be used within a TeamOptionsProvider');
  return ctx;
};
