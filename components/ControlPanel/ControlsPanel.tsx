import React from 'react';
import InfoIcon from '../ui/InfoIcon';

interface ControlsPanelProps {
  isNavLocked: boolean;
  onSetNavLock: (locked: boolean) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ isNavLocked, onSetNavLock }) => {
  return (
    <div>
      <h3 className="font-semibold mb-2">Controls</h3>
      <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Mouse: Left-click to rotate, Right-click to pan, Scroll to zoom.</p>
      <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Drag players on the field to move them.</p>
      <p className="text-sm text-gray-400 flex items-center"><InfoIcon /> Press Space to toggle navigation lock.</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
        <label htmlFor="lockNav" className="text-sm font-medium text-gray-300">Lock Navigation <span className="text-xs text-gray-500">(Space)</span></label>
        <input type="checkbox" id="lockNav" checked={isNavLocked} onChange={(e) => onSetNavLock(e.target.checked)} className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"/>
      </div>
    </div>
  );
};

export default ControlsPanel;
