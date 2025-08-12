import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html, Text } from '@react-three/drei';
import { Vector3, Plane, Raycaster, Shape, DoubleSide, ShapeGeometry, Vector2, Group } from 'three';
import type { Player, TeamOptions } from '../types';
import { FIELD_WIDTH, FIELD_LENGTH, PLAYER_ROLE_ABBREVIATIONS } from '../constants';

// --- Field Component ---
const Field: React.FC<{ onPointerMissed: (event: MouseEvent) => void }> = ({ onPointerMissed }) => {
  const lineMaterial = { color: 'white', linewidth: 2 };

  const centerCircleRadius = 9.15;
  const penaltyBoxLength = 16.5;
  const penaltyBoxWidth = 40.3;
  const goalAreaLength = 5.5;
  const goalAreaWidth = 18.32;
  const goalWidth = 7.32;
  const goalHeight = 2.44;

  const centerCirclePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new Vector3(Math.cos(angle) * centerCircleRadius, 0.01, Math.sin(angle) * centerCircleRadius));
    }
    return points;
  }, [centerCircleRadius]);
  
  return (
    <group onPointerMissed={onPointerMissed}>
      {/* Grass Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_LENGTH, FIELD_WIDTH]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Field Markings */}
      {/* Boundary Lines */}
      <Line points={[[-FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2], [FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2], [FIELD_LENGTH/2, 0.01, FIELD_WIDTH/2], [-FIELD_LENGTH/2, 0.01, FIELD_WIDTH/2], [-FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2]]} {...lineMaterial} />
      {/* Halfway Line */}
      <Line points={[[0, 0.01, -FIELD_WIDTH/2], [0, 0.01, FIELD_WIDTH/2]]} {...lineMaterial} />
      {/* Center Circle */}
      <Line points={centerCirclePoints} {...lineMaterial} />
       {/* Center Spot */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Home (Team A) Side Markings */}
      <Line points={[[-FIELD_LENGTH/2, 0.01, -penaltyBoxWidth/2], [-FIELD_LENGTH/2 + penaltyBoxLength, 0.01, -penaltyBoxWidth/2], [-FIELD_LENGTH/2 + penaltyBoxLength, 0.01, penaltyBoxWidth/2], [-FIELD_LENGTH/2, 0.01, penaltyBoxWidth/2]]} {...lineMaterial} />
      <Line points={[[-FIELD_LENGTH/2, 0.01, -goalAreaWidth/2], [-FIELD_LENGTH/2 + goalAreaLength, 0.01, -goalAreaWidth/2], [-FIELD_LENGTH/2 + goalAreaLength, 0.01, goalAreaWidth/2], [-FIELD_LENGTH/2, 0.01, goalAreaWidth/2]]} {...lineMaterial} />
      <mesh position={[-FIELD_LENGTH/2 + 11, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Away (Team B) Side Markings */}
      <Line points={[[FIELD_LENGTH/2, 0.01, -penaltyBoxWidth/2], [FIELD_LENGTH/2 - penaltyBoxLength, 0.01, -penaltyBoxWidth/2], [FIELD_LENGTH/2 - penaltyBoxLength, 0.01, penaltyBoxWidth/2], [FIELD_LENGTH/2, 0.01, penaltyBoxWidth/2]]} {...lineMaterial} />
      <Line points={[[FIELD_LENGTH/2, 0.01, -goalAreaWidth/2], [FIELD_LENGTH/2 - goalAreaLength, 0.01, -goalAreaWidth/2], [FIELD_LENGTH/2 - goalAreaLength, 0.01, goalAreaWidth/2], [FIELD_LENGTH/2, 0.01, goalAreaWidth/2]]} {...lineMaterial} />
      <mesh position={[FIELD_LENGTH/2 - 11, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>
      
      {/* Goals */}
      <mesh position={[-FIELD_LENGTH / 2, goalHeight / 2, 0]}>
        <boxGeometry args={[1, goalHeight, goalWidth]} />
        <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.5} />
      </mesh>
       <mesh position={[FIELD_LENGTH / 2, goalHeight / 2, 0]}>
        <boxGeometry args={[1, goalHeight, goalWidth]} />
        <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
};

// --- Player Component ---
interface PlayerProps {
  player: Player;
  color: string;
  isSelected: boolean;
  showPlayerNames: boolean;
  showPlayerNumbers: boolean;
  onPointerDown: (event: any, playerId: string) => void;
}

const PlayerComponent: React.FC<PlayerProps> = ({ player, color, isSelected, showPlayerNames, showPlayerNumbers, onPointerDown }) => {
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
        {showPlayerNames && (
          <Html 
            position={[0, playerHeight + 0.8, 0]} 
            center 
            occlude={true}
            wrapperClass="player-label-wrapper" 
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0,
              transform: 'translateZ(0)',
              isolation: 'auto'
            }}
            distanceFactor={10}
          >
            <div className="bg-black bg-opacity-60 text-white text-xs font-bold p-1 rounded" style={{ transform: 'translateZ(0)' }}>
              {player.name} ({PLAYER_ROLE_ABBREVIATIONS[player.role] || 'N/A'})
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
}

// --- Passing Net Component ---
interface PassingNetProps {
  players: Player[];
  playerIds: string[];
  color: string;
}

const PassingNet: React.FC<PassingNetProps> = ({ players, playerIds, color }) => {
  const activePlayers = useMemo(() => players.filter(p => playerIds.includes(p.id)), [players, playerIds]);

  if (activePlayers.length < 2) return null;
  const points = activePlayers.map(p => p.position);

  const lines = [];
  for(let i=0; i < points.length; i++) {
    for(let j=i+1; j < points.length; j++) {
      lines.push([points[i], points[j]]);
    }
  }

  return (
    <group>
      {lines.map((line, index) => (
         <Line key={index} points={line} color={color} dashed dashSize={1} gapSize={0.5} linewidth={1.5} transparent opacity={0.7} />
      ))}
    </group>
  );
};

// --- Covered Area Component ---
interface CoveredAreaProps {
  players: Player[];
  playerIds: string[];
  color: string;
}

const getConvexHull = (players: Player[]): Vector3[] => {
    const points = players.map(p => p.position);
    if (points.length <= 2) return points;
    if (points.length === 3) return points;

    // Find the centroid
    const centroid = points.reduce((acc, p) => acc.add(p), new Vector3()).divideScalar(points.length);
    
    // Sort points by angle from centroid
    const sortedPoints = [...points].sort((a, b) => {
        const angleA = Math.atan2(a.z - centroid.z, a.x - centroid.x);
        const angleB = Math.atan2(b.z - centroid.z, b.x - centroid.x);
        return angleA - angleB;
    });

    // Add first point to close the loop
    sortedPoints.push(sortedPoints[0]);

    // Smooth the polygon slightly to reduce sharp angles
    const smoothedPoints: Vector3[] = [];
    const smoothingFactor = 0.15; // Adjust this value to control smoothing amount

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const current = sortedPoints[i];
        const next = sortedPoints[i + 1];
        
        smoothedPoints.push(current);

        // Add interpolated points for smoothing
        if (i < sortedPoints.length - 1) {
            const interpolated = new Vector3()
                .addVectors(current, next)
                .multiplyScalar(smoothingFactor);
            smoothedPoints.push(interpolated);
        }
    }

    return smoothedPoints;
};

const CoveredArea: React.FC<CoveredAreaProps> = ({ players, playerIds, color }) => {
    const activePlayers = useMemo(() => players.filter(p => playerIds.includes(p.id)), [players, playerIds]);
    const hullPoints = useMemo(() => getConvexHull(activePlayers), [activePlayers]);
    const shape = useMemo(() => {
      if (hullPoints.length < 3) return null;
      const shape = new Shape();
      shape.moveTo(hullPoints[0].x, hullPoints[0].z);
      for (let i = 1; i < hullPoints.length; i++) {
        shape.lineTo(hullPoints[i].x, hullPoints[i].z);
      }
      shape.closePath();
      return shape;
    }, [hullPoints]);
    
    if (!shape) return null;
  
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} side={DoubleSide} />
      </mesh>
    );
};

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
        <PlayerComponent 
          key={player.id} 
          player={player} 
          color={teamAOptions.color} 
          isSelected={player.id === selectedPlayerId} 
          showPlayerNames={teamAOptions.showPlayerNames}
          showPlayerNumbers={teamAOptions.showPlayerNumbers}
          onPointerDown={onPlayerPointerDown}
        />
      ))}
      {teamBPlayers.map(player => (
        <PlayerComponent 
          key={player.id} 
          player={player} 
          color={teamBOptions.color} 
          isSelected={player.id === selectedPlayerId} 
          showPlayerNames={teamBOptions.showPlayerNames}
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