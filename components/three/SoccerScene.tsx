import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Plane } from 'three';
import Player3D from './Player3D.tsx';
import PassingNet from './PassingNet.tsx';
import CoveredArea from './CoveredArea.tsx';
import { useNavLock } from '../../state/NavLockContext';
import { useDrawing } from '../../state/DrawingContext';
import { useTeamOptions } from '../../state/TeamOptionsContext';
import { usePlayers } from '../../state/PlayersContext';
import Annotations from './Annotations';

// --- Main Scene ---
interface SoccerSceneProps {}

const SoccerSceneContent: React.FC<SoccerSceneProps> = () => {
  const { isNavLocked, setNavLock } = useNavLock();
  const { activeTool } = useDrawing();
  const { teamAOptions, teamBOptions } = useTeamOptions();
  const { players, selectedPlayerId, setSelectedPlayerId, updatePlayerPosition } = usePlayers();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const lastPointerPosRef = useRef<Vector3 | null>(null);
  // Player drag gesture-scoped nav-lock
  const prevNavLockBeforePlayerDragRef = useRef<boolean>(false);
  const didLockForPlayerDragRef = useRef<boolean>(false);
  // Drawing nav-lock is managed inside <Annotations />

  // Helper: exit selection/edit mode and restore nav lock if we enabled it
  const clearSelection = useCallback(() => {
    // Broadcast to annotations module to clear selection
    window.dispatchEvent(new Event('annotations:clearSelection'));
  }, []);
  
  const { camera, raycaster, pointer, gl } = useThree();
    // Removed wasNavLocked state as it is no longer needed
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new Vector3(), []);
  // Global drag listeners control
  const globalDragAttachedRef = useRef<boolean>(false);
  const computePlanePointFromClient = useCallback((ev: MouseEvent): Vector3 | null => {
    const canvas = (gl && (gl.domElement as HTMLCanvasElement)) || (document.querySelector('canvas') as HTMLCanvasElement) || null;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    const ndc = { x, y } as any;
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) return intersection.clone();
    return null;
  }, [camera, raycaster, dragPlane, intersection, gl]);

  const handleGlobalMouseMove = useCallback((ev: MouseEvent) => {
    // Player drag only (annotation moves handled in <Annotations />)
    if (activeDragId) {
      const p = computePlanePointFromClient(ev);
      if (!p) return;
  updatePlayerPosition(activeDragId, p);
    }
  }, [computePlanePointFromClient, activeDragId, updatePlayerPosition, gl]);

  const handleGlobalMouseUp = useCallback((ev: MouseEvent) => {
    // End all drags
  lastPointerPosRef.current = null;
    if (didLockForPlayerDragRef.current) {
  if (!prevNavLockBeforePlayerDragRef.current) setNavLock(false);
      didLockForPlayerDragRef.current = false;
    }
    globalDragAttachedRef.current = false;
    window.removeEventListener('mousemove', handleGlobalMouseMove as any);
    window.removeEventListener('mouseup', handleGlobalMouseUp as any);
  }, [handleGlobalMouseMove, setNavLock]);

  const attachGlobalDrag = useCallback(() => {
    if (globalDragAttachedRef.current) return;
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    globalDragAttachedRef.current = true;
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === 'A'), [players]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === 'B'), [players]);

  const onPlayerPointerDown = (event: any, playerId: string) => {
    event.stopPropagation();
  // Ask annotations to clear selection when clicking players
  clearSelection();
    // When drawing, ignore player drag/select
    if (activeTool) return;
    if (event.button !== 0) return; // only left-click starts player drag
    setActiveDragId(playerId);
  setSelectedPlayerId(playerId);
    // Lock nav for the duration of the player drag
    if (!didLockForPlayerDragRef.current) {
      prevNavLockBeforePlayerDragRef.current = isNavLocked;
  if (!isNavLocked) setNavLock(true);
      didLockForPlayerDragRef.current = true;
    }
  attachGlobalDrag();
  };

  const onPointerUp = () => {
    setActiveDragId(null);
  lastPointerPosRef.current = null;
    // Restore nav lock after player drag if we locked it
    if (didLockForPlayerDragRef.current) {
      if (!prevNavLockBeforePlayerDragRef.current) setNavLock(false);
      didLockForPlayerDragRef.current = false;
    }
  };

  const onPointerMove = (event: any) => {
  // Annotation transforms handled by <Annotations />
    if (activeDragId) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
  updatePlayerPosition(activeDragId, intersection.clone());
      }
    }
  };

  // Cleanup any global listeners on unmount
  useEffect(() => {
    return () => {
      if (globalDragAttachedRef.current) {
        globalDragAttachedRef.current = false;
        window.removeEventListener('mousemove', handleGlobalMouseMove as any);
        window.removeEventListener('mouseup', handleGlobalMouseUp as any);
      }
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);
  // Field drawing/annotation handlers have been moved into <Annotations />
  
  return (
  <group onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {/* Lighting Setup */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[50, 50, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      
  {/* Scene Components */}
  <Annotations />
      
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
export const SoccerScene: React.FC<SoccerSceneProps> = () => {
  const { isNavLocked } = useNavLock();
  return (
    <div className="scene-container" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }} onContextMenu={(e) => e.preventDefault()}>
      <Canvas shadows camera={{ position: [0, 80, 100], fov: 50 }}>
        <color attach="background" args={['#111827']} />
  <SoccerSceneContent />
        <OrbitControls
          enabled={!isNavLocked}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={20}
          maxDistance={300}
          enablePan={true}
          onChange={(e: any) => {
            const controls = e?.target;
            if (!controls) return;
            const obj = controls.object; // camera
            const tgt = controls.target;
            const minY = 0.01;
            if (obj && obj.position && obj.position.y < minY) {
              obj.position.y = minY;
            }
            if (tgt && tgt.y < 0) {
              tgt.y = 0;
            }
          }}
        />
      </Canvas>
    </div>
  );
};
