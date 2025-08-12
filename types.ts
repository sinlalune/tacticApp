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
  showPlayerNumbers: boolean;
}