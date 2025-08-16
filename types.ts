import type { Vector3 } from 'three';

export enum PlayerRole {
  GK = 'Goalkeeper',
  CB = 'Center Back',
  RB = 'Right Back',
  LB = 'Left Back',
  RWB = 'Right Wing Back',
  LWB = 'Left Wing Back',
  SW = 'Sweeper',
  CDM = 'Defensive Midfielder',
  CM = 'Central Midfielder',
  CAM = 'Attacking Midfielder',
  RM = 'Right Midfielder',
  LM = 'Left Midfielder',
  RW = 'Right Winger',
  LW = 'Left Winger',
  CF = 'Center Forward',
  ST = 'Striker',
  SS = 'Second Striker',
}

export interface Player {
  id: string;
  teamId: 'A' | 'B';
  name: string;
  number: number;
  role: PlayerRole;
  position: Vector3;
}

export interface TeamOptions {
  color: string;
  showPassingNet: boolean;
  passingNetPlayerIds: string[];
  showCoveredArea: boolean;
  coveredAreaPlayerIds: string[];
  showPlayerNames: boolean;
  showPlayerRoles: boolean;
  showPlayerNumbers: boolean;
}

// Annotations for drawing on the pitch
export type AnnotationType = 'rectangle' | 'square' | 'circle' | 'arrow';
// Tools can include non-annotation actions like erase or select
export type DrawingTool = AnnotationType | 'erase' | 'select';

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  color: string;
  lineWidth: number;
  filled: boolean;
  // Optional stroke style for outlines
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface RectAnnotation extends AnnotationBase {
  type: 'rectangle' | 'square';
  start: Vector3; // one corner
  end: Vector3;   // opposite corner
  // Optional rotation (radians) around the rectangle center
  rotation?: number;
}

export interface CircleAnnotation extends AnnotationBase {
  type: 'circle';
  center: Vector3;
  radius: number;
}

export interface ArrowAnnotation extends AnnotationBase {
  type: 'arrow';
  from: Vector3;
  to: Vector3;
}

export type Annotation = RectAnnotation | CircleAnnotation | ArrowAnnotation;