import { type Player, PlayerRole } from './types';
import { Vector3 } from 'three';

export const FIELD_WIDTH = 68; // meters
export const FIELD_LENGTH = 105; // meters

export const PLAYER_ROLES: PlayerRole[] = Object.values(PlayerRole);

/**
 * Creates a reverse mapping from PlayerRole enum values (e.g., 'Goalkeeper') to their keys (e.g., 'GK').
 * This is useful for displaying the short-form abbreviation of a player's role in the UI.
 * `Object.entries(PlayerRole)` creates an array of [key, value] pairs.
 * `.map(([key, value]) => [value, key])` swaps the key and value for each pair.
 * `Object.fromEntries(...)` converts the array of pairs back into an object.
 */
export const PLAYER_ROLE_ABBREVIATIONS = Object.fromEntries(
  Object.entries(PlayerRole).map(([key, value]) => [value, key])
) as Record<PlayerRole, string>;


const TEAM_A_PLAYERS: Omit<Player, 'teamId' | 'position'>[] = [
  { id: 'A1', name: 'Player 1', number: 1, role: PlayerRole.GK },
  { id: 'A2', name: 'Player 2', number: 2, role: PlayerRole.RB },
  { id: 'A3', name: 'Player 3', number: 4, role: PlayerRole.CB },
  { id: 'A4', name: 'Player 4', number: 5, role: PlayerRole.CB },
  { id: 'A5', name: 'Player 5', number: 3, role: PlayerRole.LB },
  { id: 'A6', name: 'Player 6', number: 6, role: PlayerRole.CDM },
  { id: 'A7', name: 'Player 7', number: 8, role: PlayerRole.CM },
  { id: 'A8', name: 'Player 8', number: 10, role: PlayerRole.CAM },
  { id: 'A9', name: 'Player 9', number: 7, role: PlayerRole.RW },
  { id: 'A10', name: 'Player 10', number: 11, role: PlayerRole.LW },
  { id: 'A11', name: 'Player 11', number: 9, role: PlayerRole.ST },
];

const TEAM_B_PLAYERS: Omit<Player, 'teamId' | 'position'>[] = [
  { id: 'B1', name: 'Player 1', number: 1, role: PlayerRole.GK },
  { id: 'B2', name: 'Player 2', number: 2, role: PlayerRole.RB },
  { id: 'B3', name: 'Player 3', number: 4, role: PlayerRole.CB },
  { id: 'B4', name: 'Player 4', number: 5, role: PlayerRole.CB },
  { id: 'B5', name: 'Player 5', number: 3, role: PlayerRole.LB },
  { id: 'B6', name: 'Player 6', number: 8, role: PlayerRole.CM },
  { id: 'B7', name: 'Player 7', number: 7, role: PlayerRole.RM },
  { id: 'B8', name: 'Player 8', number: 10, role: PlayerRole.LM },
  { id: 'B9', name: 'Player 9', number: 9, role: PlayerRole.CF },
  { id: 'B10', name: 'Player 10', number: 11, role: PlayerRole.ST },
  { id: 'B11', name: 'Player 11', number: 6, role: PlayerRole.CM },
];

// 4-3-3 Formation for Team A
const TEAM_A_POSITIONS = [
  new Vector3(-FIELD_LENGTH / 2 + 5, 0, 0), // GK
  new Vector3(-FIELD_LENGTH / 2 + 20, 0, FIELD_WIDTH / 4), // RB
  new Vector3(-FIELD_LENGTH / 2 + 18, 0, FIELD_WIDTH / 8), // CB
  new Vector3(-FIELD_LENGTH / 2 + 18, 0, -FIELD_WIDTH / 8), // CB
  new Vector3(-FIELD_LENGTH / 2 + 20, 0, -FIELD_WIDTH / 4), // LB
  new Vector3(-15, 0, 0), // CDM
  new Vector3(-10, 0, FIELD_WIDTH / 6), // CM
  new Vector3(-10, 0, -FIELD_WIDTH / 6), // CAM
  new Vector3(5, 0, FIELD_WIDTH / 3.5), // RW
  new Vector3(5, 0, -FIELD_WIDTH / 3.5), // LW
  new Vector3(10, 0, 0), // ST
];

// 4-4-2 Formation for Team B
const TEAM_B_POSITIONS = [
  new Vector3(FIELD_LENGTH / 2 - 5, 0, 0), // GK
  new Vector3(FIELD_LENGTH / 2 - 20, 0, FIELD_WIDTH / 4), // RB
  new Vector3(FIELD_LENGTH / 2 - 18, 0, FIELD_WIDTH / 8), // CB
  new Vector3(FIELD_LENGTH / 2 - 18, 0, -FIELD_WIDTH / 8), // CB
  new Vector3(FIELD_LENGTH / 2 - 20, 0, -FIELD_WIDTH / 4), // LB
  new Vector3(10, 0, FIELD_WIDTH / 6), // CM
  new Vector3(5, 0, FIELD_WIDTH / 3), // RM
  new Vector3(5, 0, -FIELD_WIDTH / 3), // LM
  new Vector3(30, 0, FIELD_WIDTH / 10), // CF
  new Vector3(30, 0, -FIELD_WIDTH / 10), // ST
  new Vector3(10, 0, -FIELD_WIDTH / 6), // CM
];


export const INITIAL_PLAYERS: Player[] = [
  ...TEAM_A_PLAYERS.map((p, i) => ({ ...p, teamId: 'A' as const, position: TEAM_A_POSITIONS[i] })),
  ...TEAM_B_PLAYERS.map((p, i) => ({ ...p, teamId: 'B' as const, position: TEAM_B_POSITIONS[i] })),
];