import React, { useState, useMemo, useCallback } from 'react';
import type { Vector3 } from 'three';
import { SoccerScene } from './components/SoccerScene';
import { INITIAL_PLAYERS, PLAYER_ROLES } from './constants';
import type { Player, TeamOptions, PlayerRole } from './types';

// --- Helper Icon Component ---
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

// --- Reusable Player Selection Component ---
interface PlayerSelectionListProps {
  players: Player[];
  selectedIds: string[];
  onTogglePlayer: (id: string) => void;
}

const PlayerSelectionList: React.FC<PlayerSelectionListProps> = ({ players, selectedIds, onTogglePlayer }) => (
    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto p-2 bg-gray-700 rounded-md border border-gray-600">
      {players.map(player => (
        <div key={player.id} className="flex items-center">
          <input
            type="checkbox"
            id={`player-select-${player.id}`}
            checked={selectedIds.includes(player.id)}
            onChange={() => onTogglePlayer(player.id)}
            className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500"
          />
          <label htmlFor={`player-select-${player.id}`} className="ml-2 text-sm text-gray-300 select-none">
            {player.number} - {player.name} ({player.role})
          </label>
        </div>
      ))}
    </div>
);

// --- Control Panel Component ---
interface ControlPanelProps {
  players: Player[];
  selectedPlayerId: string | null;
  teamAOptions: TeamOptions;
  teamBOptions: TeamOptions;
  isNavLocked: boolean;
  onPlayerUpdate: (id: string, updates: Partial<Player>) => void;
  onTeamOptionChange: (team: 'A' | 'B', updates: Partial<TeamOptions>) => void;
  onTogglePlayerSelection: (team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => void;
  onSetNavLock: (isLocked: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  players,
  selectedPlayerId,
  teamAOptions,
  teamBOptions,
  isNavLocked,
  onPlayerUpdate,
  onTeamOptionChange,
  onTogglePlayerSelection,
  onSetNavLock,
}) => {
  const selectedPlayer = useMemo(() => 
    players.find(p => p.id === selectedPlayerId), 
    [players, selectedPlayerId]
  );
  
  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === 'A'), [players]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === 'B'), [players]);

  const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedPlayer) return;
    const { name, value } = e.target;
    const updateValue = name === 'number' ? parseInt(value, 10) || 0 : value;
    onPlayerUpdate(selectedPlayer.id, { [name]: updateValue });
  };
  
  const handleTeamChange = (team: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      onTeamOptionChange(team, { [name]: type === 'checkbox' ? checked : value });
  };

  return (
    <div className="control-panel absolute top-0 right-0 h-full w-full max-w-sm bg-gray-900 bg-opacity-80 backdrop-blur-sm text-white p-4 overflow-y-auto shadow-2xl font-sans" style={{ isolation: 'isolate', zIndex: 100 }}>
      <h1 className="text-2xl font-bold text-center mb-4 border-b border-gray-600 pb-2">Tactic Board</h1>
      
      {/* Instructions and Global Controls */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4">
        <h3 className="font-semibold mb-2">Controls</h3>
        <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Mouse: Left-click to rotate, Right-click to pan, Scroll to zoom.</p>
        <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Drag players on the field to move them.</p>
        <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Press Space to toggle navigation lock.</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
            <label htmlFor="lockNav" className="text-sm font-medium text-gray-300">Lock Navigation <span className="text-xs text-gray-500">(Space)</span></label>
            <input type="checkbox" id="lockNav" checked={isNavLocked} onChange={(e) => onSetNavLock(e.target.checked)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"/>
        </div>
      </div>
      
      {/* Team Controls Template */}
      {[
        { id: 'A', name: 'Team A', options: teamAOptions, players: teamAPlayers, theme: 'blue' },
        { id: 'B', name: 'Team B', options: teamBOptions, players: teamBPlayers, theme: 'red' }
      ].map(team => (
         <div key={team.id} className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">{team.name}</h2>
            {/* Color Picker */}
            <div className="flex items-center justify-between mb-3">
              <label htmlFor={`team${team.id}Color`} className="text-sm font-medium text-gray-300">Color</label>
              <input type="color" id={`team${team.id}Color`} name="color" value={team.options.color} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="w-8 h-8 p-0 border-none rounded bg-transparent" />
            </div>
            {/* Passing Net */}
            <div className="flex items-center justify-between">
              <label htmlFor={`team${team.id}PassingNet`} className="text-sm font-medium text-gray-300">Show Passing Net</label>
              <input type="checkbox" id={`team${team.id}PassingNet`} name="showPassingNet" checked={team.options.showPassingNet} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
            </div>
            {team.options.showPassingNet && (
              <PlayerSelectionList players={team.players} selectedIds={team.options.passingNetPlayerIds} onTogglePlayer={(pid) => onTogglePlayerSelection(team.id as 'A' | 'B', 'passingNet', pid)} />
            )}
            {/* Covered Area */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
              <label htmlFor={`team${team.id}CoveredArea`} className="text-sm font-medium text-gray-300">Show Covered Area</label>
              <input type="checkbox" id={`team${team.id}CoveredArea`} name="showCoveredArea" checked={team.options.showCoveredArea} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
            </div>
             {team.options.showCoveredArea && (
              <PlayerSelectionList players={team.players} selectedIds={team.options.coveredAreaPlayerIds} onTogglePlayer={(pid) => onTogglePlayerSelection(team.id as 'A' | 'B', 'coveredArea', pid)} />
            )}

            {/* Player Label Settings */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Player Labels</h3>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor={`team${team.id}Names`} className="text-sm font-medium text-gray-300">Show Names & Roles</label>
                <input type="checkbox" id={`team${team.id}Names`} name="showPlayerNames" checked={team.options.showPlayerNames} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor={`team${team.id}Numbers`} className="text-sm font-medium text-gray-300">Show Numbers</label>
                <input type="checkbox" id={`team${team.id}Numbers`} name="showPlayerNumbers" checked={team.options.showPlayerNumbers} onChange={(e) => handleTeamChange(team.id as 'A' | 'B', e)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
              </div>
            </div>
        </div>
      ))}
      
      {/* Selected Player Controls */}
      {selectedPlayer ? (
        <div className="p-4 bg-gray-800 rounded-lg animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Edit Player</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input type="text" id="name" name="name" value={selectedPlayer.name} onChange={handlePlayerChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-300 mb-1">Number</label>
              <input type="number" id="number" name="number" value={selectedPlayer.number} onChange={handlePlayerChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
              <select id="role" name="role" value={selectedPlayer.role} onChange={handlePlayerChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                {PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-800 rounded-lg text-center text-gray-400">
            <p>Select a player on the field to edit their details.</p>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isNavLocked, setNavLock] = useState<boolean>(false);

  // Add keyboard event listener for spacebar
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if the key pressed is space and no input elements are focused
      if (event.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault(); // Prevent page scroll
        setNavLock(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  const [teamAOptions, setTeamAOptions] = useState<TeamOptions>({ 
    color: '#3b82f6', 
    showPassingNet: false, 
    passingNetPlayerIds: [], 
    showCoveredArea: false, 
    coveredAreaPlayerIds: [],
    showPlayerNames: true,
    showPlayerNumbers: true
  });
  const [teamBOptions, setTeamBOptions] = useState<TeamOptions>({ 
    color: '#ef4444', 
    showPassingNet: false, 
    passingNetPlayerIds: [], 
    showCoveredArea: false, 
    coveredAreaPlayerIds: [],
    showPlayerNames: true,
    showPlayerNumbers: true
  });

  const handlePlayerUpdate = useCallback((id: string, updates: Partial<Player>) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const handlePlayerPositionUpdate = useCallback((id: string, position: Vector3) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p => (p.id === id ? { ...p, position } : p))
    );
  }, []);

  const handleTeamOptionChange = useCallback((team: 'A' | 'B', updates: Partial<TeamOptions>) => {
    const setter = team === 'A' ? setTeamAOptions : setTeamBOptions;
    setter(prev => ({...prev, ...updates}));
  }, []);
  
  const handleTogglePlayerSelection = useCallback((team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => {
    const setter = team === 'A' ? setTeamAOptions : setTeamBOptions;
    const key = feature === 'passingNet' ? 'passingNetPlayerIds' : 'coveredAreaPlayerIds';

    setter(prev => {
      const currentIds = prev[key];
      const newIds = currentIds.includes(playerId)
        ? currentIds.filter(id => id !== playerId)
        : [...currentIds, playerId];
      return { ...prev, [key]: newIds };
    });
  }, []);

  return (
    <main className="w-screen h-screen bg-gray-900">
      <SoccerScene
        players={players}
        teamAOptions={teamAOptions}
        teamBOptions={teamBOptions}
        selectedPlayerId={selectedPlayerId}
        isNavLocked={isNavLocked}
        onSelectPlayer={setSelectedPlayerId}
        onPlayerPositionUpdate={handlePlayerPositionUpdate}
        onSetNavLock={setNavLock}
      />
      <ControlPanel
        players={players}
        selectedPlayerId={selectedPlayerId}
        teamAOptions={teamAOptions}
        teamBOptions={teamBOptions}
        isNavLocked={isNavLocked}
        onPlayerUpdate={handlePlayerUpdate}
        onTeamOptionChange={handleTeamOptionChange}
        onTogglePlayerSelection={handleTogglePlayerSelection}
        onSetNavLock={setNavLock}
      />
    </main>
  );
}
