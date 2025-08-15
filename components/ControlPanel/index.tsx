// ControlPanel: thin taskbar with popover panels for controls, team options, and player editing
import React, { useMemo, useRef, useState } from 'react';
import ControlsPanel from './ControlsPanel';
import TeamOptionsPanel from './TeamOptionsPanel';
import PlayerEditPanel from './PlayerEditPanel';
import type { Player, TeamOptions } from '../../types';

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

  const [activePanel, setActivePanel] = useState<null | 'controls' | 'teamA' | 'teamB' | 'player'>(null);
  const [popoverLeft, setPopoverLeft] = useState<number>(0);
  const barContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsBtnRef = useRef<HTMLButtonElement | null>(null);
  const teamABtnRef = useRef<HTMLButtonElement | null>(null);
  const teamBBtnRef = useRef<HTMLButtonElement | null>(null);
  const playerBtnRef = useRef<HTMLButtonElement | null>(null);

  const togglePanel = (panel: 'controls' | 'teamA' | 'teamB' | 'player', btn: HTMLButtonElement | null) => {
    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }
    if (btn && barContainerRef.current) {
      const btnRect = btn.getBoundingClientRect();
      const contRect = barContainerRef.current.getBoundingClientRect();
      const left = Math.max(0, btnRect.left - contRect.left);
      setPopoverLeft(left);
    } else {
      setPopoverLeft(0);
    }
    setActivePanel(panel);
  };

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
    <div
      className="control-panel absolute bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-sm text-white border-t border-gray-700 shadow-2xl font-sans"
      style={{ isolation: 'isolate', zIndex: 100 }}
    >
      <div className="relative" ref={barContainerRef}>
        {activePanel && (
          <div className="absolute pb-2" style={{ left: popoverLeft, bottom: 'calc(100% + 8px)' }}>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-xl w-auto max-w-[560px] inline-block align-bottom">
              {activePanel === 'controls' && (
                <ControlsPanel isNavLocked={isNavLocked} onSetNavLock={onSetNavLock} />
              )}
              {activePanel === 'teamA' && (
                <TeamOptionsPanel
                  title="Team A"
                  team="A"
                  options={teamAOptions}
                  players={teamAPlayers}
                  onTeamOptionChange={onTeamOptionChange}
                  onTogglePlayerSelection={onTogglePlayerSelection}
                />
              )}
              {activePanel === 'teamB' && (
                <TeamOptionsPanel
                  title="Team B"
                  team="B"
                  options={teamBOptions}
                  players={teamBPlayers}
                  onTeamOptionChange={onTeamOptionChange}
                  onTogglePlayerSelection={onTogglePlayerSelection}
                />
              )}
              {activePanel === 'player' && (
                <PlayerEditPanel selectedPlayer={selectedPlayer} onPlayerUpdate={onPlayerUpdate} />
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2">
          <button
            ref={controlsBtnRef}
            className={`px-3 py-1 rounded-md text-sm border border-gray-700 hover:bg-gray-800 ${activePanel === 'controls' ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-900/60'}`}
            onClick={() => togglePanel('controls', controlsBtnRef.current)}
          >
            Controls
          </button>
          <button
            ref={teamABtnRef}
            className={`px-3 py-1 rounded-md text-sm border border-gray-700 hover:bg-gray-800 ${activePanel === 'teamA' ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-900/60'}`}
            onClick={() => togglePanel('teamA', teamABtnRef.current)}
          >
            Team A
          </button>
          <button
            ref={teamBBtnRef}
            className={`px-3 py-1 rounded-md text-sm border border-gray-700 hover:bg-gray-800 ${activePanel === 'teamB' ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-900/60'}`}
            onClick={() => togglePanel('teamB', teamBBtnRef.current)}
          >
            Team B
          </button>
          <button
            ref={playerBtnRef}
            className={`px-3 py-1 rounded-md text-sm border border-gray-700 hover:bg-gray-800 ${activePanel === 'player' ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-900/60'}`}
            onClick={() => togglePanel('player', playerBtnRef.current)}
          >
            Edit Player
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
