import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { Vector3, Plane, DoubleSide } from 'three';
import type { Player, TeamOptions, Annotation, AnnotationType, DrawingTool } from '../../types';
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
  // drawing
  annotations: Annotation[];
  activeTool: DrawingTool | null;
  drawColor: string;
  drawLineWidth: number;
  drawFilled: boolean;
  drawStrokeStyle?: 'solid' | 'dashed' | 'dotted';
  addAnnotation: (ann: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  setActiveTool?: (tool: DrawingTool | null) => void;
}

const SoccerSceneContent: React.FC<SoccerSceneProps> = ({ 
  players, 
  teamAOptions, 
  teamBOptions, 
  selectedPlayerId, 
  isNavLocked, 
  onSelectPlayer, 
  onPlayerPositionUpdate,
  onSetNavLock,
  annotations,
  activeTool,
  drawColor,
  drawLineWidth,
  drawFilled,
  drawStrokeStyle,
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  setActiveTool,
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [isAlt, setIsAlt] = useState<boolean>(false);
  const [isShift, setIsShift] = useState<boolean>(false);
  const [selectionDragMode, setSelectionDragMode] = useState<null | 'move' | 'arrow-from' | 'arrow-to' | 'resize' | 'rotate'>(null);
  const lastPointerPosRef = useRef<Vector3 | null>(null);
  // For rectangle/square which corner is being resized (0..3)
  const resizeCornerRef = useRef<number | null>(null);
  // Tweak how far annotations move relative to cursor movement on the field plane
  const DRAG_SENSITIVITY = 1.8; // 1.0 = original; higher = faster
  // Local selection mode (right-click on shape toggles it)
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const prevNavLockRef = useRef<boolean>(false);
  // Drawing gesture-scoped nav-lock
  const prevNavLockBeforeDrawRef = useRef<boolean>(false);
  const didLockForDrawRef = useRef<boolean>(false);
  // Player drag gesture-scoped nav-lock
  const prevNavLockBeforePlayerDragRef = useRef<boolean>(false);
  const didLockForPlayerDragRef = useRef<boolean>(false);
  const beginDrawNavLock = useCallback(() => {
    if (!didLockForDrawRef.current) {
      prevNavLockBeforeDrawRef.current = isNavLocked;
      if (!isNavLocked) onSetNavLock(true);
      didLockForDrawRef.current = true;
    }
  }, [isNavLocked, onSetNavLock]);
  const endDrawNavLock = useCallback(() => {
    if (didLockForDrawRef.current) {
      if (!prevNavLockBeforeDrawRef.current) onSetNavLock(false);
      didLockForDrawRef.current = false;
    }
  }, [onSetNavLock]);

  // Helper: exit selection/edit mode and restore nav lock if we enabled it
  const clearSelection = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedAnnId(null);
      if (!prevNavLockRef.current) onSetNavLock(false);
    }
  }, [isSelecting, onSetNavLock]);
  
  const { camera, raycaster, size, pointer } = useThree();
    // Removed wasNavLocked state as it is no longer needed
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new Vector3(), []);

  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === 'A'), [players]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === 'B'), [players]);

  // Debug: pick current annotation being created or edited
  const activeDebugAnn = useMemo(() => {
    if (drawingId) return annotations.find(a => a.id === drawingId) || null;
    if (isSelecting && selectedAnnId) return annotations.find(a => a.id === selectedAnnId) || null;
    return null;
  }, [drawingId, isSelecting, selectedAnnId, annotations]);

  const serializeVec = useCallback((v: Vector3) => ({ x: Number(v.x.toFixed(3)), y: Number(v.y.toFixed(3)), z: Number(v.z.toFixed(3)) }), []);
  const serializeAnnotation = useCallback((ann: Annotation) => {
    const base = {
      id: ann.id,
      type: ann.type,
      color: ann.color,
      lineWidth: ann.lineWidth,
      filled: ann.filled,
      strokeStyle: ann.strokeStyle ?? 'solid',
    } as any;
    if (ann.type === 'arrow') {
      const from = (ann as any).from as Vector3; const to = (ann as any).to as Vector3;
      return { ...base, from: serializeVec(from), to: serializeVec(to) };
    }
    if (ann.type === 'circle') {
      const center = (ann as any).center as Vector3; const radius = (ann as any).radius as number;
      return { ...base, center: serializeVec(center), radius };
    }
    // rectangle or square
    const start = (ann as any).start as Vector3; const end = (ann as any).end as Vector3;
    const rotation = (ann as any).rotation ?? 0;
    return { ...base, start: serializeVec(start), end: serializeVec(end), rotation };
  }, [serializeVec]);

  const onPlayerPointerDown = (event: any, playerId: string) => {
    event.stopPropagation();
  // Exit annotation selection if clicking a player while editing
  clearSelection();
    // When drawing, ignore player drag/select
    if (activeTool) return;
    if (event.button !== 0) return; // only left-click starts player drag
    setActiveDragId(playerId);
    onSelectPlayer(playerId);
    // Lock nav for the duration of the player drag
    if (!didLockForPlayerDragRef.current) {
      prevNavLockBeforePlayerDragRef.current = isNavLocked;
      if (!isNavLocked) onSetNavLock(true);
      didLockForPlayerDragRef.current = true;
    }
  };

  const onPointerUp = () => {
    setActiveDragId(null);
    // Stop any selection drag on mouse release anywhere
    lastPointerPosRef.current = null;
    setSelectionDragMode(null);
  resizeCornerRef.current = null;
    // Keep selection mode active until user right-clicks on the shape to exit
  // End any drawing gesture-triggered nav lock when mouse is released off the field
  endDrawNavLock();
    // Restore nav lock after player drag if we locked it
    if (didLockForPlayerDragRef.current) {
      if (!prevNavLockBeforePlayerDragRef.current) onSetNavLock(false);
      didLockForPlayerDragRef.current = false;
    }
  };

  const onPointerMove = (event: any) => {
    // Apply selection transform even when pointer is over shapes/handles, not just the field
  if (isSelecting && selectedAnnId && selectionDragMode) {
      // Prefer event.ray for precise mapping
      let p: Vector3 | null = null;
      if (event && event.ray && event.ray.intersectPlane) {
        const tmp = new Vector3();
        if (event.ray.intersectPlane(dragPlane, tmp)) p = tmp.clone();
      }
      if (!p) {
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) p = intersection.clone();
      }
      if (p) {
        const last = lastPointerPosRef.current;
        if (!last) {
          lastPointerPosRef.current = p;
        } else {
          const delta = p.clone().sub(last);
          lastPointerPosRef.current = p;
      const ann = annotations.find(a => a.id === selectedAnnId);
          if (ann) {
            if (ann.type === 'arrow') {
              const from = (ann as any).from as Vector3;
              const to = (ann as any).to as Vector3;
              if (selectionDragMode === 'arrow-from') {
                // Move only the start point
                updateAnnotation(ann.id, { from: new Vector3(p.x, from.y, p.z) } as any);
              } else if (selectionDragMode === 'arrow-to') {
                // Move only the end point
                updateAnnotation(ann.id, { to: new Vector3(p.x, to.y, p.z) } as any);
              } else if (selectionDragMode === 'move') {
                // Move the entire arrow by the delta
        const scaled = delta.clone().multiplyScalar(DRAG_SENSITIVITY);
        const newFrom = new Vector3(from.x + scaled.x, from.y, from.z + scaled.z);
        const newTo = new Vector3(to.x + scaled.x, to.y, to.z + scaled.z);
                updateAnnotation(ann.id, { from: newFrom, to: newTo } as any);
              } else if (selectionDragMode === 'rotate') {
                // New rotation logic that works with the new rendering strategy
                const from = (ann as any).from as Vector3;
                const to = (ann as any).to as Vector3;
                const len = from.distanceTo(to); // Preserve the arrow's length

                // Calculate the new angle based on the cursor's position relative to the arrow's start point
                const newAngle = Math.atan2(p.z - from.z, p.x - from.x);

                // Calculate the new 'to' point using the original length and the new angle
                const newTo = new Vector3(
                  from.x + len * Math.cos(newAngle),
                  to.y, // Keep the original y-level
                  from.z + len * Math.sin(newAngle)
                );

                // Update the annotation with just the new 'to' point
                updateAnnotation(ann.id, { to: newTo });
}
            } else if (ann.type === 'circle') {
              if (selectionDragMode === 'resize') {
                const center = (ann as any).center as Vector3;
                const newRadius = Math.max(0.1, p.clone().sub(center).length());
                updateAnnotation(ann.id, { radius: newRadius } as any);
              } else {
                const scaled = delta.clone().multiplyScalar(DRAG_SENSITIVITY);
                updateAnnotation(ann.id, { center: (ann as any).center.clone().add(scaled) } as any);
              }
            } else if (ann.type === 'rectangle' || ann.type === 'square') {
              if (selectionDragMode === 'rotate') {
                const start = (ann as any).start as Vector3;
                const end = (ann as any).end as Vector3;
                const cx = (start.x + end.x) / 2;
                const cz = (start.z + end.z) / 2;
                const v = p.clone().sub(new Vector3(cx, p.y, cz));
                const angle = Math.atan2(v.z, v.x);
                updateAnnotation(ann.id, { rotation: angle } as any);
              } else if (selectionDragMode === 'resize') {
                // Resize around the center in the rectangle's local frame
                const start = (ann as any).start as Vector3;
                const end = (ann as any).end as Vector3;
                const cx = (start.x + end.x) / 2;
                const cz = (start.z + end.z) / 2;
                const rot = (ann as any).rotation ?? 0;
                // Transform pointer to local space (unrotate around center)
                const lp = p.clone().sub(new Vector3(cx, p.y, cz));
                const cosR = Math.cos(-rot);
                const sinR = Math.sin(-rot);
                const lx = lp.x * cosR - lp.z * sinR;
                const lz = lp.x * sinR + lp.z * cosR;
                let halfW = Math.max(0.1, Math.abs(lx));
                let halfH = Math.max(0.1, Math.abs(lz));
                if (ann.type === 'square') {
                  const m = Math.max(halfW, halfH);
                  halfW = m; halfH = m;
                }
                const newStart = new Vector3(cx - halfW, start.y, cz - halfH);
                const newEnd = new Vector3(cx + halfW, end.y, cz + halfH);
                updateAnnotation(ann.id, { start: newStart, end: newEnd } as any);
              } else {
                const scaled = delta.clone().multiplyScalar(DRAG_SENSITIVITY);
                updateAnnotation(ann.id, { start: (ann as any).start.clone().add(scaled), end: (ann as any).end.clone().add(scaled) } as any);
              }
            }
          }
        }
  }
      return;
    }
    if (activeDragId) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        onPlayerPositionUpdate(activeDragId, intersection.clone());
      }
    }
  };

  // Drawing interactions on the field
  const screenToPlane = (event?: any): Vector3 | null => {
    // Prefer the event's ray for precise mapping from the actual hit object
    if (event && event.ray && typeof event.ray.intersectPlane === 'function') {
      const tmp = new Vector3();
      if (event.ray.intersectPlane(dragPlane, tmp)) return tmp.clone();
    }
    // Fallback to global raycaster using normalized pointer
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) return intersection.clone();
    return null;
  };
  // Keyboard modifiers and delete for selected annotation
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Alt') setIsAlt(true);
      if (ev.key === 'Shift') setIsShift(true);
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        if (selectedAnnId) {
          removeAnnotation(selectedAnnId);
          setSelectedAnnId(null);
        }
      }
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === 'Alt') setIsAlt(false);
      if (ev.key === 'Shift') setIsShift(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedAnnId, removeAnnotation]);

  const distPointToSegment = useCallback((a: Vector3, b: Vector3, pnt: Vector3) => {
    const ap = pnt.clone().sub(a);
    const ab = b.clone().sub(a);
    const t = Math.max(0, Math.min(1, ap.dot(ab) / Math.max(1e-6, ab.lengthSq())));
    const proj = a.clone().add(ab.multiplyScalar(t));
    return proj.distanceTo(pnt);
  }, []);

  const pickAnnotationAt = (p: Vector3): Annotation | undefined => {
    const threshold = 1.0; // meters
    return annotations.slice().reverse().find(a => {
      if (a.type === 'rectangle' || a.type === 'square') {
        const start = (a as any).start as Vector3;
        const end = (a as any).end as Vector3;
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        return p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ;
      }
      if (a.type === 'circle') {
        const center = (a as any).center as Vector3;
        const radius = (a as any).radius as number;
        return p.distanceTo(new Vector3(center.x, p.y, center.z)) <= radius + threshold * 0.25;
      }
      if (a.type === 'arrow') {
        const from = (a as any).from as Vector3;
        const to = (a as any).to as Vector3;
        return distPointToSegment(new Vector3(from.x, p.y, from.z), new Vector3(to.x, p.y, to.z), p) <= threshold * 0.5;
      }
      return false;
    });
  };

  const onFieldPointerDown = (e: any) => {
    // Clicking the field counts as outside any annotation: clear selection on left or right click
    if (e && (e.button === 0 || e.button === 2)) {
      clearSelection();
    }
    // Only drawing starts from the field; selection is initiated by right-click on a shape only
    // Only left-click draws when a drawing tool is active
    if (!activeTool || e.button !== 0 || activeTool === 'select') return;
  const p = screenToPlane(e);
    if (!p) return;
    // Lock nav for the duration of the drawing gesture (only for shape tools)
    if (activeTool === 'rectangle' || activeTool === 'square' || activeTool === 'circle' || activeTool === 'arrow') {
      beginDrawNavLock();
    }
    const id = `ann_${Date.now()}`;
    if (activeTool === 'rectangle' || activeTool === 'square') {
      addAnnotation({ id, type: activeTool, color: drawColor, lineWidth: drawLineWidth, filled: drawFilled, strokeStyle: drawStrokeStyle ?? 'solid', start: p, end: p });
      setDrawingId(id);
    } else if (activeTool === 'circle') {
      addAnnotation({ id, type: 'circle', color: drawColor, lineWidth: drawLineWidth, filled: drawFilled, strokeStyle: drawStrokeStyle ?? 'solid', center: p, radius: 0 });
      setDrawingId(id);
    } else if (activeTool === 'arrow') {
      addAnnotation({ id, type: 'arrow', color: drawColor, lineWidth: drawLineWidth, filled: false, strokeStyle: drawStrokeStyle ?? 'solid', from: p, to: p });
      setDrawingId(id);
    } else if (activeTool === 'erase') {
      // simple hit test to remove annotation under pointer
      const threshold = 1.0; // meters
      // find first matching
      const target = annotations.find(a => {
        if (a.type === 'rectangle' || a.type === 'square') {
          const start = (a as any).start as Vector3;
          const end = (a as any).end as Vector3;
          const minX = Math.min(start.x, end.x);
          const maxX = Math.max(start.x, end.x);
          const minZ = Math.min(start.z, end.z);
          const maxZ = Math.max(start.z, end.z);
          return p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ;
        }
        if (a.type === 'circle') {
          const center = (a as any).center as Vector3;
          const radius = (a as any).radius as number;
          return p.distanceTo(new Vector3(center.x, p.y, center.z)) <= radius + threshold * 0.25;
        }
        if (a.type === 'arrow') {
          const from = (a as any).from as Vector3;
          const to = (a as any).to as Vector3;
          return distPointToSegment(new Vector3(from.x, p.y, from.z), new Vector3(to.x, p.y, to.z), p) <= threshold * 0.5;
        }
        return false;
      });
      if (target) removeAnnotation(target.id);
    }
  };

  const onFieldPointerMove = (e: any) => {
    // Selection drag handled in onPointerMove to avoid duplicate updates
    if (isSelecting && selectedAnnId && selectionDragMode) return;
    if (!drawingId) return;
    const p = screenToPlane(e);
    if (!p) return;
    const ann = annotations.find(a => a.id === drawingId);
    if (!ann) return;
    if (ann.type === 'rectangle' || ann.type === 'square') {
      updateAnnotation(ann.id, { end: p } as any);
    } else if (ann.type === 'circle') {
      // radius in plane coordinates
      updateAnnotation(ann.id, { radius: p.clone().sub((ann as any).center).length() } as any);
    } else if (ann.type === 'arrow') {
  // The 'from' point was already set on pointer down.
  // We only need to update the 'to' point to follow the cursor.
  updateAnnotation(ann.id, { to: new Vector3(p.x, (ann as any).from.y, p.z) } as any);
    }
  };

  const onFieldPointerUp = () => {
    setDrawingId(null);
    lastPointerPosRef.current = null;
    setSelectionDragMode(null);
    // Selection mode ends on mouse up handled by onPointerUp as well
  // Restore nav-lock state when finishing a drawing gesture
  endDrawNavLock();
    // Deactivate drawing tool after completing a shape to return to standard mode
    if (setActiveTool && (activeTool === 'rectangle' || activeTool === 'square' || activeTool === 'circle' || activeTool === 'arrow')) {
      setActiveTool(null);
    }
  };

  const onAnnotationPointerDown = (e: any, ann: Annotation) => {
    // If left-clicking on a different annotation while in selection mode,
    // do NOT exit selection; just swallow the event so the field doesn't clear it.
    if (e.button === 0 && isSelecting && selectedAnnId && selectedAnnId !== ann.id) {
      e.stopPropagation();
      return;
    }
    // Right-click toggles selection mode on the shape
    if (e.button === 2) {
      e.stopPropagation();
      if (e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') e.nativeEvent.preventDefault();
      if (!isSelecting || selectedAnnId !== ann.id) {
        // Enter selection mode on this shape
        setIsSelecting(true);
        setSelectedAnnId(ann.id);
        prevNavLockRef.current = isNavLocked;
        if (!isNavLocked) onSetNavLock(true);
      } else {
        // Exit selection mode and restore nav lock
        setIsSelecting(false);
        setSelectedAnnId(null);
        if (!prevNavLockRef.current) onSetNavLock(false);
      }
      return;
    }
  // Left-click and drag transforms only when in selection mode on this shape
  if (e.button === 0 && isSelecting && selectedAnnId === ann.id) {
      // determine drag mode
      if (ann.type === 'arrow') {
        // Alt = rotate; default move. Endpoint drags are started by explicit handle meshes.
        setSelectionDragMode(isAlt ? 'rotate' : 'move');
      } else if (ann.type === 'circle') {
        setSelectionDragMode('move');
      } else {
        setSelectionDragMode(isAlt ? 'rotate' : 'move');
      }
      // begin drag
      const p = screenToPlane(e);
  lastPointerPosRef.current = p;
      e.stopPropagation();
    }
  };
  
  return (
    <group onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
      {/* Lighting Setup */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[50, 50, 50]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      
      {/* Scene Components */}
  <Field onPointerMissed={(e?: any) => { onSelectPlayer(null); }} onPointerDown={onFieldPointerDown} onPointerMove={onFieldPointerMove} onPointerUp={onFieldPointerUp} />
      
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

      {/* Render annotations */}
      {annotations.map(a => {
        if (a.type === 'rectangle' || a.type === 'square') {
          const start = (a as any).start as Vector3;
          const end = (a as any).end as Vector3;
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.z - start.z);
          const cx = (start.x + end.x) / 2;
          const cz = (start.z + end.z) / 2;
          const w = a.type === 'square' ? Math.max(width, height) : width;
          const h = a.type === 'square' ? Math.max(width, height) : height;
          const x1 = cx - w/2; const x2 = cx + w/2; const z1 = cz - h/2; const z2 = cz + h/2;
          const y = 0.035;
          const dashed = (a.strokeStyle ?? 'solid') !== 'solid';
          const dotted = (a.strokeStyle ?? 'solid') === 'dotted';
          const dashSize = dotted ? 0.6 : 2.0;
          const gapSize = dotted ? 0.6 : 1.2;
          const rot = (a as any).rotation ?? 0;
          // Build rectangle points around center to allow rotation via group
          const localPoints: [number, number, number][] = [[-w/2, y, -h/2],[w/2, y, -h/2],[w/2, y, h/2],[-w/2, y, h/2],[-w/2, y, -h/2]];
          const selLocalPoints: [number, number, number][] = localPoints.map(p => [p[0], p[1]+0.001, p[2]]);
          return (
            <group key={a.id} onPointerDown={(e) => onAnnotationPointerDown(e, a)} position={[cx, 0, cz]} rotation={[0, -rot, 0]}>
              {a.filled && (
                <mesh rotation={[-Math.PI/2,0,0]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
                  <planeGeometry args={[w, h]} />
                  <meshBasicMaterial color={a.color} transparent opacity={0.2} />
                </mesh>
              )}
              {/* Invisible pick plane to allow inside clicks for selection/drag when not filled */}
              {!a.filled && (
                <mesh rotation={[-Math.PI/2,0,0]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
                  <planeGeometry args={[w, h]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
              )}
              <Line points={localPoints} color={a.color} lineWidth={a.lineWidth} dashed={dashed} dashSize={dashSize} gapSize={gapSize} />
              {selectedAnnId === a.id && (
                <>
                  <Line points={selLocalPoints} color={'#ffffff'} lineWidth={1} dashed={true} dashSize={0.4} gapSize={0.4} />
                  {/* corner handles */}
                  {([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]] as Array<[number,number]>).map(([lx,lz], idx) => (
                    <mesh key={idx} position={[lx, y, lz]} onPointerDown={(e) => { e.stopPropagation(); setSelectedAnnId(a.id); setSelectionDragMode('resize'); resizeCornerRef.current = idx; lastPointerPosRef.current = screenToPlane(e); }}>
                      <sphereGeometry args={[0.6, 16, 16]} />
                      <meshBasicMaterial color={'#ffffff'} />
                    </mesh>
                  ))}
                  {/* rotate handle at top-middle */}
                  <mesh position={[0, y, -h/2 - 2]} onPointerDown={(e) => { e.stopPropagation(); setSelectedAnnId(a.id); setSelectionDragMode('rotate'); lastPointerPosRef.current = screenToPlane(e); }}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshBasicMaterial color={'#ffcc00'} />
                  </mesh>
                </>
              )}
            </group>
          );
        }
        if (a.type === 'circle') {
          const center = (a as any).center as Vector3;
          const radius = (a as any).radius as number;
          const y = 0.035;
          const points: [number, number, number][] = [];
          const segments = 64;
          for (let i=0;i<=segments;i++) {
            const ang = (i/segments) * Math.PI * 2;
            points.push([center.x + Math.cos(ang)*radius, y, center.z + Math.sin(ang)*radius]);
          }
          const dashed = (a.strokeStyle ?? 'solid') !== 'solid';
          const dotted = (a.strokeStyle ?? 'solid') === 'dotted';
          const dashSize = dotted ? 0.6 : 2.0;
          const gapSize = dotted ? 0.6 : 1.2;
          return (
            <group key={a.id} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
              {a.filled && (
                <mesh rotation={[-Math.PI/2,0,0]} position={[center.x, y, center.z]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
                  <circleGeometry args={[radius, segments]} />
                  <meshBasicMaterial color={a.color} transparent opacity={0.2} />
                </mesh>
              )}
              {/* Invisible pick disc for selection/drag when not filled */}
              {!a.filled && (
                <mesh rotation={[-Math.PI/2,0,0]} position={[center.x, y, center.z]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
                  <circleGeometry args={[Math.max(0.001, radius), segments]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
              )}
              <Line points={points} color={a.color} lineWidth={a.lineWidth} dashed={dashed} dashSize={dashSize} gapSize={gapSize} />
              {selectedAnnId === a.id && (
                <>
                  <Line points={points} color={'#ffffff'} lineWidth={1} dashed={true} dashSize={0.4} gapSize={0.4} />
                  {/* move handle at center */}
                  <mesh position={[center.x, y, center.z]} onPointerDown={(e) => { e.stopPropagation(); setSelectedAnnId(a.id); setSelectionDragMode('move'); lastPointerPosRef.current = screenToPlane(e); }}>
                    <sphereGeometry args={[0.6, 16, 16]} />
                    <meshBasicMaterial color={'#ffffff'} />
                  </mesh>
                  {/* resize handle at +X */}
                  <mesh position={[center.x + Math.max(0.5, radius), y, center.z]} onPointerDown={(e) => { e.stopPropagation(); setSelectedAnnId(a.id); setSelectionDragMode('resize'); lastPointerPosRef.current = screenToPlane(e); }}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshBasicMaterial color={'#ffcc00'} />
                  </mesh>
                </>
              )}
            </group>
          );
        }
        if (a.type === 'arrow') {
  const from = (a as any).from as Vector3;
  const to = (a as any).to as Vector3;
  const y = 0.04;

  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.max(0.0001, Math.sqrt(dx * dx + dz * dz));
  const yaw = Math.atan2(dz, dx); // This calculation is correct...

  const dashed = (a.strokeStyle ?? 'solid') !== 'solid';
  const dotted = (a.strokeStyle ?? 'solid') === 'dotted';
  const dashSize = dotted ? 0.6 : 2.0;
  const gapSize = dotted ? 0.6 : 1.2;

  const headLength = 2.0;
  const headWidth = 1.6;

  const headPositions = new Float32Array([
    0, 0, 0,
    -headLength, 0, -headWidth / 2,
    -headLength, 0, headWidth / 2,
  ]);

  return (
    // THE FIX: We negate the yaw angle to correct for the coordinate system inversion.
  <group key={a.id} position={[from.x, 0, from.z]} rotation={[0, -yaw, 0]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
      {/* Shaft */}
      {(() => {
        const headLenClamped = Math.min(headLength, len);
        const shaftEndLocalX = len - headLenClamped;
        return (
          <Line
            points={[[0, y, 0], [shaftEndLocalX, y, 0]]}
            color={a.color}
            lineWidth={a.lineWidth}
            dashed={dashed}
            dashSize={dashSize}
            gapSize={gapSize}
            onPointerDown={(e) => {
              if (e.button === 0 && isSelecting && selectedAnnId === a.id) {
                e.stopPropagation();
                setSelectionDragMode('move');
                lastPointerPosRef.current = screenToPlane(e);
              }
            }}
          />
        );
      })()}

      {/* Arrow Head */}
      <mesh
        position={[len, y + 0.0005, 0]}
        onPointerDown={(e) => {
          if (e.button === 0 && isSelecting && selectedAnnId === a.id) {
            e.stopPropagation();
            setSelectionDragMode('arrow-to');
            lastPointerPosRef.current = screenToPlane(e);
          }
        }}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={headPositions} count={3} itemSize={3} />
        </bufferGeometry>
        <meshBasicMaterial color={a.color} side={DoubleSide} />
      </mesh>

      {/* Selection Handles */}
      {selectedAnnId === a.id && (
        <>
          <mesh position={[0, y, 0]} onPointerDown={(e) => { e.stopPropagation(); setSelectionDragMode('arrow-from'); lastPointerPosRef.current = screenToPlane(e); }}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial color={'#ffffff'} />
          </mesh>
          <mesh position={[len, y, 0]} onPointerDown={(e) => { e.stopPropagation(); setSelectionDragMode('arrow-to'); lastPointerPosRef.current = screenToPlane(e); }}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial color={'#ffffff'} />
          </mesh>
          <mesh position={[len / 2, y, 2]} onPointerDown={(e) => { e.stopPropagation(); setSelectionDragMode('rotate'); lastPointerPosRef.current = screenToPlane(e); }}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={'#ffcc00'} />
          </mesh>
        </>
      )}
    </group>
  );
}
        return null;
      })}
      {/* Debug annotation context window: visible while creating or editing
      {activeDebugAnn && (
        <Html transform={false} prepend style={{ position: 'fixed', top: 12, right: 12, maxWidth: 380, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, zIndex: 1000 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Annotation Context</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(serializeAnnotation(activeDebugAnn), null, 2)}</pre>
        </Html>
      )} */}
    </group>
  );
};

// --- Canvas Wrapper ---
export const SoccerScene: React.FC<SoccerSceneProps> = (props) => {
  return (
    <div className="scene-container" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }} onContextMenu={(e) => e.preventDefault()}>
      <Canvas shadows camera={{ position: [0, 80, 100], fov: 50 }}>
        <color attach="background" args={['#111827']} />
        <SoccerSceneContent {...props} />
        <OrbitControls enabled={!props.isNavLocked} />
      </Canvas>
    </div>
  );
};
