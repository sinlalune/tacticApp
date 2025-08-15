import React, { useMemo } from 'react';
import { Shape, Vector3, DoubleSide } from 'three';
import { Player } from '../../types';

interface CoveredAreaProps {
  players: Player[];
  playerIds: string[];
  color: string;
}

const getConvexHull = (players: Player[]): Vector3[] => {
  const points = players.map(p => p.position);
  if (points.length <= 2) return points;
  if (points.length === 3) return points;

  const centroid = points.reduce((acc, p) => acc.add(p), new Vector3()).divideScalar(points.length);
  const sortedPoints = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.z - centroid.z, a.x - centroid.x);
    const angleB = Math.atan2(b.z - centroid.z, b.x - centroid.x);
    return angleA - angleB;
  });
  sortedPoints.push(sortedPoints[0]);

  const smoothedPoints: Vector3[] = [];
  const smoothingFactor = 0.15;
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const current = sortedPoints[i];
    const next = sortedPoints[i + 1];
    smoothedPoints.push(current);
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

export default CoveredArea;
