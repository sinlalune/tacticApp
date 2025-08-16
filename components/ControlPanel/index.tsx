// ControlPanel: thin taskbar with popover panels for controls, team options, and player editing
import React, { useMemo, useRef, useState } from 'react';
import ControlsPanel from './ControlsPanel';
import TeamOptionsPanel from './TeamOptionsPanel';
import PlayerEditPanel from './PlayerEditPanel';
import type { Player, TeamOptions, AnnotationType, DrawingTool } from '../../types';

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
  // drawing
  activeTool: DrawingTool | null;
  setActiveTool: (tool: DrawingTool | null) => void;
  drawColor: string;
  setDrawColor: (c: string) => void;
  drawLineWidth: number;
  setDrawLineWidth: (w: number) => void;
  drawFilled: boolean;
  setDrawFilled: (f: boolean) => void;
  drawStrokeStyle: 'solid' | 'dashed' | 'dotted';
  setDrawStrokeStyle: (s: 'solid'|'dashed'|'dotted') => void;
  clearAnnotations: () => void;
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
  activeTool,
  setActiveTool,
  drawColor,
  setDrawColor,
  drawLineWidth,
  setDrawLineWidth,
  drawFilled,
  setDrawFilled,
  drawStrokeStyle,
  setDrawStrokeStyle,
  clearAnnotations,
}) => {
  const selectedPlayer = useMemo(() =>
    players.find(p => p.id === selectedPlayerId),
    [players, selectedPlayerId]
  );
  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === 'A'), [players]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === 'B'), [players]);

  const [activePanel, setActivePanel] = useState<null | 'controls' | 'teamA' | 'teamB' | 'player' | 'draw'>(null);
  const [popoverLeft, setPopoverLeft] = useState<number>(0);
  const barContainerRef = useRef<HTMLDivElement | null>(null);
  const controlsBtnRef = useRef<HTMLButtonElement | null>(null);
  const teamABtnRef = useRef<HTMLButtonElement | null>(null);
  const teamBBtnRef = useRef<HTMLButtonElement | null>(null);
  const playerBtnRef = useRef<HTMLButtonElement | null>(null);

  const togglePanel = (panel: 'controls' | 'teamA' | 'teamB' | 'player' | 'draw', btn: HTMLButtonElement | null) => {
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
              {activePanel === 'draw' && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Draw</h2>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-gray-300">Tool</span>
                    <div className="flex gap-2 justify-self-end">
                      {(['rectangle','square','circle','arrow','erase'] as DrawingTool[]).map(tool => (
                        <button key={tool} onClick={() => setActiveTool(activeTool === tool ? null : tool)} className={`px-2 py-1 text-xs rounded border ${activeTool === tool ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-900/60 border-gray-700 hover:bg-gray-800'}`}>{tool}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-2">
                    <label htmlFor="drawColor" className="text-sm font-medium text-gray-300">Color</label>
                    <input id="drawColor" type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-transparent justify-self-end" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-2">
                    <label htmlFor="drawWidth" className="text-sm font-medium text-gray-300">Line Width</label>
                    <input id="drawWidth" type="number" min={1} max={8} value={drawLineWidth} onChange={e => setDrawLineWidth(Math.max(1, Math.min(8, parseInt(e.target.value||'1',10))))} className="w-20 bg-gray-700 border border-gray-600 text-white rounded-md p-1 justify-self-end" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-3">
                    <label htmlFor="drawFilled" className="text-sm font-medium text-gray-300">Filled</label>
                    <input id="drawFilled" type="checkbox" checked={drawFilled} onChange={e => setDrawFilled(e.target.checked)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 justify-self-end" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-3">
                    <label htmlFor="drawStrokeStyle" className="text-sm font-medium text-gray-300">Outline</label>
                    <select
                      id="drawStrokeStyle"
                      value={drawStrokeStyle}
                      onChange={e => setDrawStrokeStyle(e.target.value as 'solid'|'dashed'|'dotted')}
                      className="w-28 bg-gray-700 border border-gray-600 text-white rounded-md p-1 justify-self-end"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-400">Tip: Click and drag on the pitch to draw. Use Clear to erase all.</span>
                    <button onClick={clearAnnotations} className="px-3 py-1 rounded-md text-sm border border-gray-700 hover:bg-gray-800 bg-gray-900/60">Clear</button>
                  </div>
                </div>
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
          <button
            className={`px-3 py-1 rounded-md text-sm border border-gray-700 hover:bg-gray-800 ${activePanel === 'draw' ? 'bg-indigo-600 border-indigo-500' : 'bg-gray-900/60'}`}
            onClick={(e) => togglePanel('draw', e.currentTarget as HTMLButtonElement)}
          >
            Draw
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
