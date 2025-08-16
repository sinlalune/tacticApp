import React from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { FIELD_WIDTH, FIELD_LENGTH } from '../../constants';

interface FieldProps {
  onPointerMissed: (event: MouseEvent) => void;
  onPointerDown?: (e: any) => void;
  onPointerMove?: (e: any) => void;
  onPointerUp?: (e: any) => void;
}

const Field: React.FC<FieldProps> = ({ onPointerMissed, onPointerDown, onPointerMove, onPointerUp }) => {
  const lineMaterial = { color: 'white', linewidth: 2 };

  const centerCircleRadius = 9.15;
  const penaltyBoxLength = 16.5;
  const penaltyBoxWidth = 40.3;
  const goalAreaLength = 5.5;
  const goalAreaWidth = 18.32;
  const goalWidth = 7.32;
  const goalHeight = 2.44;

  const centerCirclePoints = React.useMemo(() => {
    const points = [] as Vector3[];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new Vector3(Math.cos(angle) * centerCircleRadius, 0.01, Math.sin(angle) * centerCircleRadius));
    }
    return points;
  }, [centerCircleRadius]);

  return (
    <group onPointerMissed={onPointerMissed} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_LENGTH, FIELD_WIDTH]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      <Line points={[[-FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2], [FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2], [FIELD_LENGTH/2, 0.01, FIELD_WIDTH/2], [-FIELD_LENGTH/2, 0.01, FIELD_WIDTH/2], [-FIELD_LENGTH/2, 0.01, -FIELD_WIDTH/2]]} {...lineMaterial} />
      <Line points={[[0, 0.01, -FIELD_WIDTH/2], [0, 0.01, FIELD_WIDTH/2]]} {...lineMaterial} />
      <Line points={centerCirclePoints} {...lineMaterial} />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      <Line points={[[-FIELD_LENGTH/2, 0.01, -penaltyBoxWidth/2], [-FIELD_LENGTH/2 + penaltyBoxLength, 0.01, -penaltyBoxWidth/2], [-FIELD_LENGTH/2 + penaltyBoxLength, 0.01, penaltyBoxWidth/2], [-FIELD_LENGTH/2, 0.01, penaltyBoxWidth/2]]} {...lineMaterial} />
      <Line points={[[-FIELD_LENGTH/2, 0.01, -goalAreaWidth/2], [-FIELD_LENGTH/2 + goalAreaLength, 0.01, -goalAreaWidth/2], [-FIELD_LENGTH/2 + goalAreaLength, 0.01, goalAreaWidth/2], [-FIELD_LENGTH/2, 0.01, goalAreaWidth/2]]} {...lineMaterial} />
      <mesh position={[-FIELD_LENGTH/2 + 11, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

      <Line points={[[FIELD_LENGTH/2, 0.01, -penaltyBoxWidth/2], [FIELD_LENGTH/2 - penaltyBoxLength, 0.01, -penaltyBoxWidth/2], [FIELD_LENGTH/2 - penaltyBoxLength, 0.01, penaltyBoxWidth/2], [FIELD_LENGTH/2, 0.01, penaltyBoxWidth/2]]} {...lineMaterial} />
      <Line points={[[FIELD_LENGTH/2, 0.01, -goalAreaWidth/2], [FIELD_LENGTH/2 - goalAreaLength, 0.01, -goalAreaWidth/2], [FIELD_LENGTH/2 - goalAreaLength, 0.01, goalAreaWidth/2], [FIELD_LENGTH/2, 0.01, goalAreaWidth/2]]} {...lineMaterial} />
      <mesh position={[FIELD_LENGTH/2 - 11, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]}/>
        <meshBasicMaterial color="white" />
      </mesh>

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

export default Field;
