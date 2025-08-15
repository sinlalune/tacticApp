import React, { useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Plane, Vector2 } from 'three';
import type { Player, TeamOptions } from '../../types';
import Field from './Field.tsx';
import Player3D from './Player3D.tsx';
import PassingNet from './PassingNet.tsx';
import CoveredArea from './CoveredArea.tsx';

// --- Main Scene ---
interface SoccerSceneProps {
  players: Player[];
  teamAOptions: TeamOptions;
  teamBOptions: TeamOptions;
  selectedPlayerId: string | null;
  isNavLocked: boolean;
  onSelectPlayer: (playerId: string | null) => void;
  onPlayerPositionUpdate: (playerId: string, newPosition: Vector3) => void;
  onSetNavLock: (locked: boolean) => void;
}

const SoccerSceneContent: React.FC<SoccerSceneProps> = ({ 
  players, 
  teamAOptions, 
  teamBOptions, 
  selectedPlayerId, 
  isNavLocked, 
  onSelectPlayer, 
  onPlayerPositionUpdate,
  onSetNavLock 
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [wasNavLocked, setWasNavLocked] = useState<boolean>(false);
  
  const { camera, raycaster, controls, size } = useThree();
  
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new Vector3(), []);

  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === 'A'), [players]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === 'B'), [players]);

  const onPlayerPointerDown = (event: any, playerId: string) => {
    event.stopPropagation();
    setActiveDragId(playerId);
    onSelectPlayer(playerId);
    
    // Store current nav lock state and lock navigation
    if (!isNavLocked) {
      setWasNavLocked(false);
      onSetNavLock(true);
    }
  };

  const onPointerUp = () => {
    setActiveDragId(null);
    
    // Restore previous nav lock state
    if (!wasNavLocked && activeDragId) {
      onSetNavLock(false);
    }
  };

  const onPointerMove = (event: any) => {
    if (activeDragId) {
      raycaster.setFromCamera(
        new Vector2(
          (event.clientX / size.width) * 2 - 1,
          -(event.clientY / size.height) * 2 + 1,
        ),
        camera
      );
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        onPlayerPositionUpdate(activeDragId, intersection.clone());
      }
    }
  };
  
  return (
    <group onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      {/* Lighting Setup */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[50, 50, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      
      {/* Scene Components */}
      <Field onPointerMissed={() => onSelectPlayer(null)} />
      
    {teamAPlayers.map(player => (
        <Player3D 
          key={player.id} 
          player={player} 
          color={teamAOptions.color} 
          isSelected={player.id === selectedPlayerId} 
      showPlayerNames={teamAOptions.showPlayerNames}
      showPlayerRoles={teamAOptions.showPlayerRoles}
          showPlayerNumbers={teamAOptions.showPlayerNumbers}
          onPointerDown={onPlayerPointerDown}
        />
      ))}
    {teamBPlayers.map(player => (
        <Player3D 
          key={player.id} 
          player={player} 
          color={teamBOptions.color} 
          isSelected={player.id === selectedPlayerId} 
      showPlayerNames={teamBOptions.showPlayerNames}
      showPlayerRoles={teamBOptions.showPlayerRoles}
          showPlayerNumbers={teamBOptions.showPlayerNumbers}
          onPointerDown={onPlayerPointerDown}
        />
      ))}

      {teamAOptions.showPassingNet && <PassingNet players={teamAPlayers} playerIds={teamAOptions.passingNetPlayerIds} color={teamAOptions.color} />}
      {teamBOptions.showPassingNet && <PassingNet players={teamBPlayers} playerIds={teamBOptions.passingNetPlayerIds} color={teamBOptions.color} />}

      {teamAOptions.showCoveredArea && <CoveredArea players={teamAPlayers} playerIds={teamAOptions.coveredAreaPlayerIds} color={teamAOptions.color} />}
      {teamBOptions.showCoveredArea && <CoveredArea players={teamBPlayers} playerIds={teamBOptions.coveredAreaPlayerIds} color={teamBOptions.color} />}
    </group>
  );
};

// --- Canvas Wrapper ---
export const SoccerScene: React.FC<SoccerSceneProps> = (props) => {
  return (
    <div className="scene-container" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
      <Canvas shadows camera={{ position: [0, 80, 100], fov: 50 }}>
        <color attach="background" args={['#111827']} />
        <SoccerSceneContent {...props} />
        <OrbitControls enabled={!props.isNavLocked} />
      </Canvas>
    </div>
  );
};
