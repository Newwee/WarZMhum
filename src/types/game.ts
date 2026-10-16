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
  isSprinting?: boolean;
  isReloading?: boolean;
  isPunching?: boolean;
  isSlashing?: boolean;
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

export type WeaponType = 'UNARMED' | 'KNIFE' | 'PISTOL' | 'SHOTGUN' | 'RIFLE' | 'SNIPER' | 'ICEWALL' | 'MEDKIT';
export type ItemCategory = 'ALL' | 'WEAPONS' | 'AMMO' | 'MEDICAL' | 'UTILITY';

export interface StashItem {
  id: string;
  key: 'M4A1' | 'SNIPER' | 'SHOTGUN' | 'PISTOL' | 'KNIFE' | 'AMMO_556' | 'AMMO_45' | 'AMMO_SNIPER' | 'AMMO_SHOTGUN' | 'ICEWALL' | 'MEDKIT';
  name: string;
  category: ItemCategory;
  count: number;
  maxStack: number;
  weight: number;
  slotType: 1 | 2 | 3 | 4 | 5 | 'AMMO';
  cost: number;
  description: string;
}

export interface PlayerLoadout {
  slot1: StashItem | null; // Primary Weapon (M4A1 / Sniper / Shotgun)
  slot2: StashItem | null; // Secondary Weapon (.45 Pistol / Knife)
  slot3: StashItem | null; // Utility (IceWall)
  slot4: StashItem | null; // Heal (Medkit)
  slot5: StashItem | null; // Melee / Misc (Knife / Fists)
  rifleAmmoReserve: number; // 5.56mm reserve rounds brought into raid
  pistolAmmoReserve: number; // .45 ACP reserve rounds brought into raid
  sniperAmmoReserve: number; // .338 Lapua reserve rounds brought into raid
  shotgunAmmoReserve: number; // 12-Gauge reserve shells brought into raid
  backpack: StashItem[]; // Extra items in military ruck
}

export interface GroundLootCrate {
  id: string;
  ownerId: string;
  ownerName: string;
  position: [number, number, number];
  loadout: PlayerLoadout;
  money: number;
  looted: boolean;
  timestamp: number;
}

export interface PlayerInventory {
  money: number;
  hasRifle: boolean;
  rifleAmmo: number;
  rifleAmmoReserve: number;
  hasPistol: boolean;
  pistolAmmo: number;
  pistolAmmoReserve: number;
  hasSniper: boolean;
  sniperAmmo: number;
  sniperAmmoReserve: number;
  hasShotgun: boolean;
  shotgunAmmo: number;
  shotgunAmmoReserve: number;
  hasKnife: boolean;
  iceWalls: number;
  medkits: number;
  loadout?: PlayerLoadout;
  stash?: StashItem[];
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

export interface KillFeedItem {
  id: string;
  killerName: string;
  victimName: string;
  weapon: string;
  isHeadshot: boolean;
  isPvP: boolean;
  timestamp: number;
}
