import React from 'react';
import type { Player } from '../types';

export interface PlayerSelectionListProps {
  players: Player[];
  selectedIds: string[];
  onTogglePlayer: (id: string) => void;
}

export const PlayerSelectionList: React.FC<PlayerSelectionListProps> = ({ players, selectedIds, onTogglePlayer }) => (
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

export default PlayerSelectionList;
