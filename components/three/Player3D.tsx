import React, { useRef } from 'react';
import { Html, Text } from '@react-three/drei';
import { Group } from 'three';
import type { Player } from '../../types';
import { PLAYER_ROLE_ABBREVIATIONS } from '../../constants';

interface PlayerProps {
  player: Player;
  color: string;
  isSelected: boolean;
  showPlayerNames: boolean;
  showPlayerRoles: boolean;
  showPlayerNumbers: boolean;
  onPointerDown: (event: any, playerId: string) => void;
}

const Player3D: React.FC<PlayerProps> = ({ player, color, isSelected, showPlayerNames, showPlayerRoles, showPlayerNumbers, onPointerDown }) => {
  const playerRef = useRef<Group>(null);
  const playerHeight = 1.8;

  return (
    <group 
      ref={playerRef} 
      position={player.position}
      onPointerDown={(e) => onPointerDown(e, player.id)}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, playerHeight, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={isSelected ? color : 'black'}
          emissiveIntensity={isSelected ? 0.8 : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
  {(showPlayerNames || showPlayerRoles) && (
        <Html 
          position={[0, playerHeight + 0.8, 0]}
          center 
          occlude={true}
          wrapperClass="player-label-wrapper" 
          style={{ pointerEvents: 'none', userSelect: 'none', zIndex: 0, transform: 'translateZ(0)', isolation: 'auto' }}
          distanceFactor={10}
        >
          <div className="bg-black bg-opacity-60 text-white text-xs font-bold p-1 rounded" style={{ transform: 'translateZ(0)' }}>
            {showPlayerNames ? player.name : ''}
            {showPlayerNames && showPlayerRoles ? ' ' : ''}
            {showPlayerRoles ? `(${PLAYER_ROLE_ABBREVIATIONS[player.role] || 'N/A'})` : ''}
          </div>
        </Html>
      )}
      {showPlayerNumbers && (
        <Text
          position={[0, playerHeight + 0.1, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          renderOrder={-1}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {player.number}
        </Text>
      )}
    </group>
  );
};

export default Player3D;
