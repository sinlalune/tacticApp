import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { DoubleSide, Plane, Vector3 } from 'three';
import type { Annotation } from '../../types';
import Field from './Field.tsx';
import { useDrawing } from '../../state/DrawingContext';
import { useNavLock } from '../../state/NavLockContext';

// Encapsulates all annotation rendering and interactions, including Field pointer handlers
const Annotations: React.FC = () => {
  const { camera, raycaster, pointer } = useThree();
  const { isNavLocked, setNavLock } = useNavLock();
  const {
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
  } = useDrawing();

  // Local annotation selection/drawing state
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isAlt, setIsAlt] = useState<boolean>(false);
  const [selectionDragMode, setSelectionDragMode] = useState<null | 'move' | 'arrow-from' | 'arrow-to' | 'resize' | 'rotate'>(null);
  const prevNavLockRef = useRef<boolean>(false);

  // Drag utils
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new Vector3(), []);
  // Keep lastPointerPos only for drawing drag (annotations creation); selection drags use snapshot-based direct mapping
  const lastPointerPosRef = useRef<Vector3 | null>(null);
  const DRAG_SENSITIVITY = 1.0;

  // Gesture-scoped nav lock for drawing
  const prevNavLockBeforeDrawRef = useRef<boolean>(false);
  const didLockForDrawRef = useRef<boolean>(false);
  const beginDrawNavLock = useCallback(() => {
    if (!didLockForDrawRef.current) {
      prevNavLockBeforeDrawRef.current = isNavLocked;
      if (!isNavLocked) setNavLock(true);
      didLockForDrawRef.current = true;
    }
  }, [isNavLocked, setNavLock]);
  const endDrawNavLock = useCallback(() => {
    if (didLockForDrawRef.current) {
      if (!prevNavLockBeforeDrawRef.current) setNavLock(false);
      didLockForDrawRef.current = false;
    }
  }, [setNavLock]);

  // Keyboard modifiers and delete key handling
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Alt') setIsAlt(true);
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        if (selectedAnnId) {
          removeAnnotation(selectedAnnId);
          setSelectedAnnId(null);
        }
      }
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === 'Alt') setIsAlt(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [removeAnnotation, selectedAnnId]);

  // Utilities
  const screenToPlane = (event?: any): Vector3 | null => {
    if (event && event.ray && typeof event.ray.intersectPlane === 'function') {
      const tmp = new Vector3();
      if (event.ray.intersectPlane(dragPlane, tmp)) return tmp.clone();
    }
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) return intersection.clone();
    return null;
  };

  const distPointToSegment = useCallback((a: Vector3, b: Vector3, pnt: Vector3) => {
    const ap = pnt.clone().sub(a);
    const ab = b.clone().sub(a);
    const t = Math.max(0, Math.min(1, ap.dot(ab) / Math.max(1e-6, ab.lengthSq())));
    const proj = a.clone().add(ab.multiplyScalar(t));
    return proj.distanceTo(pnt);
  }, []);

  // Simple hit test utility (currently unused but kept for possible left-click selection on field)
  const pickAnnotationAt = (p: Vector3): Annotation | undefined => {
    const threshold = 1.0; // meters
    return annotations
      .slice()
      .reverse()
      .find((a) => {
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
          return (
            distPointToSegment(
              new Vector3(from.x, p.y, from.z),
              new Vector3(to.x, p.y, to.z),
              p
            ) <= threshold * 0.5
          );
        }
        return false;
      });
  };

  // Global drag listeners for annotation transforms/drawing
  const globalDragAttachedRef = useRef<boolean>(false);
  type DragState = {
    annId: string;
    shapeType: 'arrow' | 'circle' | 'rectangle' | 'square';
    mode: 'move' | 'arrow-from' | 'arrow-to' | 'resize' | 'rotate';
    startPointer: Vector3;
    // Arrow
    initialFrom?: Vector3;
    initialTo?: Vector3;
    initialLength?: number;
    // Circle
    initialCenter?: Vector3;
    initialRadius?: number;
    // Rect/Square
    initialStart?: Vector3;
    initialEnd?: Vector3;
    initialRotation?: number;
  };
  const selectionDragRef = useRef<DragState | null>(null);

  const updateSelectionAt = useCallback((p: Vector3) => {
    const st = selectionDragRef.current;
    if (!st) return;
    const delta = p.clone().sub(st.startPointer);
    if (st.shapeType === 'arrow') {
      const from = st.initialFrom!; const to = st.initialTo!;
      if (st.mode === 'arrow-from') {
        updateAnnotation(st.annId, { from: new Vector3(p.x, from.y, p.z) } as any);
      } else if (st.mode === 'arrow-to') {
        updateAnnotation(st.annId, { to: new Vector3(p.x, to.y, p.z) } as any);
      } else if (st.mode === 'move') {
        updateAnnotation(st.annId, { from: from.clone().add(delta), to: to.clone().add(delta) } as any);
      } else if (st.mode === 'rotate') {
        const len = st.initialLength ?? from.distanceTo(to);
        const ang = Math.atan2(p.z - from.z, p.x - from.x);
        const newTo = new Vector3(from.x + len * Math.cos(ang), to.y, from.z + len * Math.sin(ang));
        updateAnnotation(st.annId, { to: newTo } as any);
      }
      return;
    }
    if (st.shapeType === 'circle') {
      const center = st.initialCenter!;
      if (st.mode === 'resize') {
        const newRadius = Math.max(0.1, p.clone().sub(center).length());
        updateAnnotation(st.annId, { radius: newRadius } as any);
      } else {
        updateAnnotation(st.annId, { center: center.clone().add(delta) } as any);
      }
      return;
    }
    // rectangle or square
    const start = st.initialStart!; const end = st.initialEnd!; const rot = st.initialRotation ?? 0;
    if (st.mode === 'rotate') {
      const cx = (start.x + end.x) / 2; const cz = (start.z + end.z) / 2;
      const v = p.clone().sub(new Vector3(cx, p.y, cz));
      const angle = Math.atan2(v.z, v.x);
      updateAnnotation(st.annId, { rotation: angle } as any);
    } else if (st.mode === 'resize') {
      const cx = (start.x + end.x) / 2; const cz = (start.z + end.z) / 2;
      const lp = p.clone().sub(new Vector3(cx, p.y, cz));
      const cosR = Math.cos(-rot); const sinR = Math.sin(-rot);
      const lx = lp.x * cosR - lp.z * sinR; const lz = lp.x * sinR + lp.z * cosR;
      let halfW = Math.max(0.1, Math.abs(lx)); let halfH = Math.max(0.1, Math.abs(lz));
      if (st.shapeType === 'square') { const m = Math.max(halfW, halfH); halfW = m; halfH = m; }
      updateAnnotation(st.annId, { start: new Vector3(cx - halfW, start.y, cz - halfH), end: new Vector3(cx + halfW, end.y, cz + halfH) } as any);
    } else {
      updateAnnotation(st.annId, { start: start.clone().add(delta), end: end.clone().add(delta) } as any);
    }
  }, [updateAnnotation]);
  const handleGlobalMouseMove = useCallback((ev: MouseEvent) => {
    // Selection drag uses snapshot-based mapping
    if (isSelecting && selectedAnnId && selectionDragMode && selectionDragRef.current) {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      let p: Vector3 | null = null;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y } as any, camera);
        const tmp = new Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, tmp)) p = tmp.clone();
      }
      if (!p) return;
      updateSelectionAt(p);
      return;
    }

    // Drawing drag
    if (drawingId) {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      let p: Vector3 | null = null;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y } as any, camera);
        const tmp = new Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, tmp)) p = tmp.clone();
      }
      if (!p) return;
      const ann = annotations.find(a => a.id === drawingId);
      if (!ann) return;
      if (ann.type === 'rectangle' || ann.type === 'square') {
        updateAnnotation(ann.id, { end: p } as any);
      } else if (ann.type === 'circle') {
        updateAnnotation(ann.id, { radius: p.clone().sub((ann as any).center).length() } as any);
      } else if (ann.type === 'arrow') {
        updateAnnotation(ann.id, { to: new Vector3(p.x, (ann as any).from.y, p.z) } as any);
      }
    }
  }, [camera, dragPlane, drawingId, isSelecting, raycaster, selectedAnnId, selectionDragMode, updateSelectionAt, updateAnnotation]);

  const handleGlobalMouseUp = useCallback(() => {
    setDrawingId(null);
    lastPointerPosRef.current = null;
    setSelectionDragMode(null);
    selectionDragRef.current = null;
    endDrawNavLock();
    if (globalDragAttachedRef.current) {
      globalDragAttachedRef.current = false;
      window.removeEventListener('mousemove', handleGlobalMouseMove as any);
      window.removeEventListener('mouseup', handleGlobalMouseUp as any);
    }
  }, [endDrawNavLock, handleGlobalMouseMove]);

  const attachGlobalDrag = useCallback(() => {
    if (globalDragAttachedRef.current) return;
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    globalDragAttachedRef.current = true;
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  useEffect(() => () => {
    if (globalDragAttachedRef.current) {
      globalDragAttachedRef.current = false;
      window.removeEventListener('mousemove', handleGlobalMouseMove as any);
      window.removeEventListener('mouseup', handleGlobalMouseUp as any);
    }
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Start a selection drag with a snapshot for smooth transforms
  const beginSelectionDrag = useCallback(
    (e: any, ann: Annotation, mode: DragState['mode']) => {
      const p = screenToPlane(e);
      if (!p) return;
      if (ann.type === 'arrow') {
        const from = (ann as any).from as Vector3;
        const to = (ann as any).to as Vector3;
        selectionDragRef.current = {
          annId: ann.id,
          shapeType: 'arrow',
          mode,
          startPointer: p,
          initialFrom: from.clone(),
          initialTo: to.clone(),
          initialLength: from.distanceTo(to),
        };
      } else if (ann.type === 'circle') {
        const center = (ann as any).center as Vector3;
        const radius = (ann as any).radius as number;
        selectionDragRef.current = {
          annId: ann.id,
          shapeType: 'circle',
          mode,
          startPointer: p,
          initialCenter: center.clone(),
          initialRadius: radius,
        };
      } else {
        const start = (ann as any).start as Vector3;
        const end = (ann as any).end as Vector3;
        const rotation = (ann as any).rotation ?? 0;
        selectionDragRef.current = {
          annId: ann.id,
          shapeType: ann.type,
          mode,
          startPointer: p,
          initialStart: start.clone(),
          initialEnd: end.clone(),
          initialRotation: rotation,
        };
      }
      attachGlobalDrag();
    },
    [attachGlobalDrag]
  );

  // Allow external triggers (like clicking a player) to clear annotation selection
  useEffect(() => {
    const onClear = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectedAnnId(null);
        if (!prevNavLockRef.current) setNavLock(false);
      }
    };
    window.addEventListener('annotations:clearSelection', onClear as any);
    return () => window.removeEventListener('annotations:clearSelection', onClear as any);
  }, [isSelecting, setNavLock]);

  const clearSelection = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectedAnnId(null);
      if (!prevNavLockRef.current) setNavLock(false);
    }
  }, [isSelecting, setNavLock]);

  // Field pointer handlers (drawing/erase)
  const onFieldPointerDown = (e: any) => {
    // Clicking the field clears annotation selection
    if (e && (e.button === 0 || e.button === 2)) {
      clearSelection();
    }
    if (!activeTool || e.button !== 0 || activeTool === 'select') return;
    const p = screenToPlane(e);
    if (!p) return;

    if (activeTool === 'rectangle' || activeTool === 'square' || activeTool === 'circle' || activeTool === 'arrow') {
      beginDrawNavLock();
    }
    const id = `ann_${Date.now()}`;
    if (activeTool === 'rectangle' || activeTool === 'square') {
      addAnnotation({ id, type: activeTool, color: drawColor, lineWidth: drawLineWidth, filled: drawFilled, strokeStyle: drawStrokeStyle ?? 'solid', start: p, end: p });
      setDrawingId(id);
      attachGlobalDrag();
    } else if (activeTool === 'circle') {
      addAnnotation({ id, type: 'circle', color: drawColor, lineWidth: drawLineWidth, filled: drawFilled, strokeStyle: drawStrokeStyle ?? 'solid', center: p, radius: 0 });
      setDrawingId(id);
      attachGlobalDrag();
    } else if (activeTool === 'arrow') {
      addAnnotation({ id, type: 'arrow', color: drawColor, lineWidth: drawLineWidth, filled: false, strokeStyle: drawStrokeStyle ?? 'solid', from: p, to: p });
      setDrawingId(id);
      attachGlobalDrag();
    } else if (activeTool === 'erase') {
      const threshold = 1.0;
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
    if (!drawingId) return;
    const p = screenToPlane(e);
    if (!p) return;
    const ann = annotations.find(a => a.id === drawingId);
    if (!ann) return;
    if (ann.type === 'rectangle' || ann.type === 'square') {
      updateAnnotation(ann.id, { end: p } as any);
    } else if (ann.type === 'circle') {
      updateAnnotation(ann.id, { radius: p.clone().sub((ann as any).center).length() } as any);
    } else if (ann.type === 'arrow') {
      updateAnnotation(ann.id, { to: new Vector3(p.x, (ann as any).from.y, p.z) } as any);
    }
  };

  const onFieldPointerUp = () => {
    setDrawingId(null);
    lastPointerPosRef.current = null;
    setSelectionDragMode(null);
    endDrawNavLock();
    if (setActiveTool && (activeTool === 'rectangle' || activeTool === 'square' || activeTool === 'circle' || activeTool === 'arrow')) {
      setActiveTool(null);
    }
    if (globalDragAttachedRef.current) {
      globalDragAttachedRef.current = false;
      window.removeEventListener('mousemove', handleGlobalMouseMove as any);
      window.removeEventListener('mouseup', handleGlobalMouseUp as any);
    }
  };

  // Annotation entity pointer-down (selection and transform start)
  const onAnnotationPointerDown = (e: any, ann: Annotation) => {
    e.stopPropagation();
    if (e.button === 0 && isSelecting && selectedAnnId && selectedAnnId !== ann.id) {
      return;
    }
    if (e.button === 2) {
      if (e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') e.nativeEvent.preventDefault();
      if (!isSelecting || selectedAnnId !== ann.id) {
        setIsSelecting(true);
        setSelectedAnnId(ann.id);
        prevNavLockRef.current = isNavLocked;
        if (!isNavLocked) setNavLock(true);
      } else {
        setIsSelecting(false);
        setSelectedAnnId(null);
        if (!prevNavLockRef.current) setNavLock(false);
      }
      return;
    }
    if (e.button === 0 && isSelecting && selectedAnnId === ann.id) {
      const mode = ann.type === 'circle' ? 'move' : (isAlt ? 'rotate' : 'move');
      setSelectionDragMode(mode);
      beginSelectionDrag(e, ann, mode);
    }
  };

  const onPointerMove = (event: any) => {
    if (!(isSelecting && selectedAnnId && selectionDragMode && selectionDragRef.current)) return;
    let p: Vector3 | null = null;
    if (event && event.ray && event.ray.intersectPlane) {
      const tmp = new Vector3();
      if (event.ray.intersectPlane(dragPlane, tmp)) p = tmp.clone();
    }
    if (!p) {
      raycaster.setFromCamera(pointer, camera);
      const tmp2 = new Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, tmp2)) p = tmp2.clone();
    }
    if (!p) return;
    updateSelectionAt(p);
  };

  // Render helpers
  const renderRectOrSquare = (a: Annotation) => {
    const start = (a as any).start as Vector3;
    const end = (a as any).end as Vector3;
    const rot = (a as any).rotation ?? 0;
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.z - start.z);
    const cx = (start.x + end.x) / 2;
    const cz = (start.z + end.z) / 2;
    const w = a.type === 'square' ? Math.max(width, height) : width;
    const h = a.type === 'square' ? Math.max(width, height) : height;
    const y = 0.035;
    const dashed = (a.strokeStyle ?? 'solid') !== 'solid';
    const dotted = (a.strokeStyle ?? 'solid') === 'dotted';
    const dashSize = dotted ? 0.6 : 2.0;
    const gapSize = dotted ? 0.6 : 1.2;
    const localPoints: [number, number, number][] = [
      [-w / 2, y, -h / 2],
      [w / 2, y, -h / 2],
      [w / 2, y, h / 2],
      [-w / 2, y, h / 2],
      [-w / 2, y, -h / 2],
    ];
    const selLocalPoints: [number, number, number][] = localPoints.map((p) => [p[0], p[1] + 0.001, p[2]]);
    return (
      <group key={a.id} onPointerDown={(e) => onAnnotationPointerDown(e, a)} position={[cx, 0, cz]} rotation={[0, -rot, 0]}>
        {a.filled ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color={a.color} transparent opacity={0.2} side={DoubleSide} depthWrite={false} />
          </mesh>
        ) : (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
          </mesh>
        )}
        <Line points={localPoints} color={a.color} lineWidth={a.lineWidth} dashed={dashed} dashSize={dashSize} gapSize={gapSize} />
        {selectedAnnId === a.id && (
          <>
            <Line points={selLocalPoints} color={'#ffffff'} lineWidth={1} dashed={true} dashSize={0.4} gapSize={0.4} />
            {([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as Array<[number, number]>).map(
              ([lx, lz], idx) => (
                <mesh
                  key={idx}
                  position={[lx, y, lz]}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedAnnId(a.id);
                    setSelectionDragMode('resize');
                    beginSelectionDrag(e, a, 'resize');
                  }}
                >
                  <sphereGeometry args={[0.6, 16, 16]} />
                  <meshBasicMaterial color={'#ffffff'} />
                </mesh>
              )
            )}
            <mesh
              position={[0, y, -h / 2 - 2]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedAnnId(a.id);
                setSelectionDragMode('rotate');
                beginSelectionDrag(e, a, 'rotate');
              }}
            >
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color={'#ffcc00'} />
            </mesh>
          </>
        )}
      </group>
    );
  };

  const renderCircle = (a: Annotation) => {
    const center = (a as any).center as Vector3;
    const radius = (a as any).radius as number;
    const y = 0.035;
    const points: [number, number, number][] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const ang = (i / segments) * Math.PI * 2;
      points.push([center.x + Math.cos(ang) * radius, y, center.z + Math.sin(ang) * radius]);
    }
    const dashed = (a.strokeStyle ?? 'solid') !== 'solid';
    const dotted = (a.strokeStyle ?? 'solid') === 'dotted';
    const dashSize = dotted ? 0.6 : 2.0;
    const gapSize = dotted ? 0.6 : 1.2;
    return (
      <group key={a.id} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
        {a.filled ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, y + 0.0005, center.z]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
            <circleGeometry args={[radius, segments]} />
            <meshBasicMaterial color={a.color} transparent opacity={0.2} side={DoubleSide} depthWrite={false} />
          </mesh>
        ) : (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, y + 0.0005, center.z]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
            <circleGeometry args={[Math.max(0.001, radius), segments]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
          </mesh>
        )}
        <Line points={points} color={a.color} lineWidth={a.lineWidth} dashed={dashed} dashSize={dashSize} gapSize={gapSize} />
        {selectedAnnId === a.id && (
          <>
            <Line points={points} color={'#ffffff'} lineWidth={1} dashed={true} dashSize={0.4} gapSize={0.4} />
            <mesh
              position={[center.x, y, center.z]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedAnnId(a.id);
                setSelectionDragMode('move');
                beginSelectionDrag(e, a, 'move');
              }}
            >
              <sphereGeometry args={[0.6, 16, 16]} />
              <meshBasicMaterial color={'#ffffff'} />
            </mesh>
            <mesh
              position={[center.x + Math.max(0.5, radius), y, center.z]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedAnnId(a.id);
                setSelectionDragMode('resize');
                beginSelectionDrag(e, a, 'resize');
              }}
            >
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color={'#ffcc00'} />
            </mesh>
          </>
        )}
      </group>
    );
  };

  const renderArrow = (a: Annotation) => {
    const from = (a as any).from as Vector3;
    const to = (a as any).to as Vector3;
    const y = 0.04;
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.max(0.0001, Math.sqrt(dx * dx + dz * dz));
    const yaw = Math.atan2(dz, dx);
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
      <group key={a.id} position={[from.x, 0, from.z]} rotation={[0, -yaw, 0]} onPointerDown={(e) => onAnnotationPointerDown(e, a)}>
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
                  beginSelectionDrag(e, a, 'move');
                }
              }}
            />
          );
        })()}
        <mesh
          position={[len, y + 0.0005, 0]}
          onPointerDown={(e) => {
            if (e.button === 0 && isSelecting && selectedAnnId === a.id) {
              e.stopPropagation();
              setSelectionDragMode('arrow-to');
              beginSelectionDrag(e, a, 'arrow-to');
            }
          }}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={headPositions} count={3} itemSize={3} />
          </bufferGeometry>
          <meshBasicMaterial color={a.color} side={DoubleSide} />
        </mesh>
        {selectedAnnId === a.id && (
          <>
            <mesh
              position={[0, y, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectionDragMode('arrow-from');
                beginSelectionDrag(e, a, 'arrow-from');
              }}
            >
              <sphereGeometry args={[0.6, 16, 16]} />
              <meshBasicMaterial color={'#ffffff'} />
            </mesh>
            <mesh
              position={[len, y, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectionDragMode('arrow-to');
                beginSelectionDrag(e, a, 'arrow-to');
              }}
            >
              <sphereGeometry args={[0.6, 16, 16]} />
              <meshBasicMaterial color={'#ffffff'} />
            </mesh>
            <mesh
              position={[len / 2, y, 2]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectionDragMode('rotate');
                beginSelectionDrag(e, a, 'rotate');
              }}
            >
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial color={'#ffcc00'} />
            </mesh>
          </>
        )}
      </group>
    );
  };

  const onFieldPointerMissed = (e: MouseEvent) => {
    if (e && (e.button === 0 || e.button === 2)) clearSelection();
  };

  return (
    <group onPointerMove={onPointerMove}>
      <Field
        onPointerMissed={onFieldPointerMissed}
        onPointerDown={onFieldPointerDown}
        onPointerMove={onFieldPointerMove}
        onPointerUp={onFieldPointerUp}
      />
      {annotations.map((a) => {
        if (a.type === 'rectangle' || a.type === 'square') return renderRectOrSquare(a);
        if (a.type === 'circle') return renderCircle(a);
        if (a.type === 'arrow') return renderArrow(a);
        return null;
      })}
    </group>
  );
};

export default Annotations;
