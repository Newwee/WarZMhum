export type RoomStatus = 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED';

export interface Room {
  id: string;
  room_code: string;
  host_profile_id: string;
  title: string;
  max_players: number;
  current_players: number;
  status: RoomStatus;
  current_wave: number;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  profile_id: string;
  role: 'HOST' | 'PLAYER';
  is_ready: boolean;
  display_name: string;
  joined_at: string;
}

export interface PlayerTransform {
  position: [number, number, number];
  rotation: [number, number, number]; // [pitch, yaw, roll]
  isMoving: boolean;
  isShooting: boolean;
  currentWeapon: string;
}

export interface PlayerNetState {
  id: string;
  name: string;
  transform: PlayerTransform;
  health: number;
  maxHealth: number;
  isDead: boolean;
  score: number;
  kills: number;
  ping?: number;
}

export type ZombieType = 'WALKER' | 'RUNNER' | 'TANK';

export interface ZombieNetState {
  id: string;
  type: ZombieType;
  position: [number, number, number];
  rotation: number;
  health: number;
  maxHealth: number;
  speed: number;
  state: 'IDLE' | 'WANDERING' | 'CHASING' | 'ATTACKING' | 'DEAD';
  targetPlayerId?: string;
}

export interface ShootEvent {
  shooterId: string;
  origin: [number, number, number];
  direction: [number, number, number];
  timestamp: number;
  hitZombieId?: string;
  damage?: number;
  isHeadshot?: boolean;
}

export interface WaveState {
  wave: number;
  zombiesRemaining: number;
  totalZombiesInWave: number;
  isWaveActive: boolean;
  nextWaveCountdown?: number;
}

export interface PlayerSummary {
  id: string;
  name: string;
  kills: number;
  score: number;
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  survivalSeconds: number;
}

export interface MatchSummary {
  finalWave: number;
  totalZombiesKilled: number;
  survivalSeconds: number;
  completed: boolean;
  players: PlayerSummary[];
}

export type WeaponType = 'UNARMED' | 'RIFLE' | 'PISTOL' | 'ICEWALL' | 'MEDKIT';

export interface PlayerInventory {
  money: number;
  hasRifle: boolean;
  rifleAmmo: number;
  hasPistol: boolean;
  pistolAmmo: number;
  iceWalls: number;
  medkits: number;
}

export interface IceWallObject {
  id: string;
  ownerId: string;
  position: [number, number, number];
  rotation: number;
  health: number;
  maxHealth: number;
  createdAt: number;
  expiresAt: number;
}
