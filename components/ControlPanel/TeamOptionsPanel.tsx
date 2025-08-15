import React from 'react';
import PlayerSelectionList from '../PlayerSelectionList';
import type { Player, TeamOptions } from '../../types';

interface TeamOptionsPanelProps {
  title: string;
  team: 'A' | 'B';
  options: TeamOptions;
  players: Player[];
  onTeamOptionChange: (team: 'A' | 'B', updates: Partial<TeamOptions>) => void;
  onTogglePlayerSelection: (team: 'A' | 'B', feature: 'passingNet' | 'coveredArea', playerId: string) => void;
}

const TeamOptionsPanel: React.FC<TeamOptionsPanelProps> = ({ title, team, options, players, onTeamOptionChange, onTogglePlayerSelection }) => {
  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onTeamOptionChange(team, { [name]: type === 'checkbox' ? checked : value });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-3">
        <label htmlFor={`team${team}Color`} className="text-sm font-medium text-gray-300">Color</label>
        <input type="color" id={`team${team}Color`} name="color" value={options.color} onChange={handleTeamChange} className="w-8 h-8 p-0 border-none rounded bg-transparent justify-self-end" />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <label htmlFor={`team${team}PassingNet`} className="text-sm font-medium text-gray-300">Show Passing Net</label>
        <input type="checkbox" id={`team${team}PassingNet`} name="showPassingNet" checked={options.showPassingNet} onChange={handleTeamChange} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 justify-self-end" />
      </div>
      {options.showPassingNet && (
        <PlayerSelectionList players={players} selectedIds={options.passingNetPlayerIds} onTogglePlayer={(pid) => onTogglePlayerSelection(team, 'passingNet', pid)} />
      )}
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 mt-3 pt-3 border-t border-gray-700">
        <label htmlFor={`team${team}CoveredArea`} className="text-sm font-medium text-gray-300">Show Covered Area</label>
        <input type="checkbox" id={`team${team}CoveredArea`} name="showCoveredArea" checked={options.showCoveredArea} onChange={handleTeamChange} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 justify-self-end" />
      </div>
      {options.showCoveredArea && (
        <PlayerSelectionList players={players} selectedIds={options.coveredAreaPlayerIds} onTogglePlayer={(pid) => onTogglePlayerSelection(team, 'coveredArea', pid)} />
      )}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Player Labels</h3>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-2">
          <label htmlFor={`team${team}Names`} className="text-sm font-medium text-gray-300">Show Names</label>
          <input type="checkbox" id={`team${team}Names`} name="showPlayerNames" checked={options.showPlayerNames} onChange={handleTeamChange} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 justify-self-end" />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-2">
          <label htmlFor={`team${team}Roles`} className="text-sm font-medium text-gray-300">Show Roles</label>
          <input type="checkbox" id={`team${team}Roles`} name="showPlayerRoles" checked={options.showPlayerRoles} onChange={handleTeamChange} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 justify-self-end" />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <label htmlFor={`team${team}Numbers`} className="text-sm font-medium text-gray-300">Show Numbers</label>
          <input type="checkbox" id={`team${team}Numbers`} name="showPlayerNumbers" checked={options.showPlayerNumbers} onChange={handleTeamChange} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 justify-self-end" />
        </div>
      </div>
    </div>
  );
};

export default TeamOptionsPanel;
