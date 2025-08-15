import React from 'react';
import { PLAYER_ROLES } from '../../constants';
import type { Player } from '../../types';

interface PlayerEditPanelProps {
  selectedPlayer?: Player;
  onPlayerUpdate: (id: string, updates: Partial<Player>) => void;
}

const PlayerEditPanel: React.FC<PlayerEditPanelProps> = ({ selectedPlayer, onPlayerUpdate }) => {
  const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedPlayer) return;
    const { name, value } = e.target;
    const updateValue = name === 'number' ? parseInt(value, 10) || 0 : value;
    onPlayerUpdate(selectedPlayer.id, { [name]: updateValue });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Edit Player</h2>
      {selectedPlayer ? (
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
      ) : (
        <div className="text-gray-400">Select a player on the field to edit their details.</div>
      )}
    </div>
  );
};

export default PlayerEditPanel;
