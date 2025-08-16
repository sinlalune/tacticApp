import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Player } from '../../types';

interface PassingNetProps {
  players: Player[];
  playerIds: string[];
  color: string;
}

const PassingNet: React.FC<PassingNetProps> = ({ players, playerIds, color }) => {
  const activePlayers = useMemo(() => players.filter(p => playerIds.includes(p.id)), [players, playerIds]);
  if (activePlayers.length < 2) return null;

  const points = activePlayers.map(p => p.position);

  const lines: any[] = [];
  for(let i=0; i < points.length; i++) {
    for(let j=i+1; j < points.length; j++) {
      lines.push([points[i], points[j]]);
    }
  }

  return (
    <group renderOrder={1000}>
      {lines.map((line, index) => (
         <Line 
           key={index} 
           points={line}
           color={color}
           dashed
           dashSize={1}
           gapSize={0.5}
           lineWidth={2}
           transparent
           opacity={0.7}
           depthTest={false}
         />
      ))}
    </group>
  );
};

export default PassingNet;
