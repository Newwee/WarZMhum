import { StashItem, PlayerLoadout, PlayerInventory } from '@/types/game';

// Standard Catalog Items available in Marketplace / Stash
export const CATALOG_ITEMS: Omit<StashItem, 'id'>[] = [
  {
    key: 'M4A1',
    name: 'M4A1 Assault Rifle',
    category: 'WEAPONS',
    count: 1,
    maxStack: 1,
    weight: 3.4,
    slotType: 1,
    cost: 2500,
    description: '5.56mm NATO assault rifle with 30-round mag and iron sights.',
  },
  {
    key: 'PISTOL',
    name: '.45 Thunder Revolver',
    category: 'WEAPONS',
    count: 1,
    maxStack: 1,
    weight: 1.2,
    slotType: 2,
    cost: 1000,
    description: 'Heavy .45 caliber sidearm with high stopping power.',
  },
  {
    key: 'AMMO_556',
    name: '5.56mm Ammo Box (30 Rnds)',
    category: 'AMMO',
    count: 30,
    maxStack: 180,
    weight: 0.8,
    slotType: 'AMMO',
    cost: 200,
    description: 'Standard 5.56x45mm military surplus rounds for M4A1.',
  },
  {
    key: 'AMMO_45',
    name: '.45 ACP Ammo Box (12 Rnds)',
    category: 'AMMO',
    count: 12,
    maxStack: 96,
    weight: 0.5,
    slotType: 'AMMO',
    cost: 100,
    description: 'Heavy .45 ACP handgun rounds for .45 Thunder Revolver.',
  },
  {
    key: 'ICEWALL',
    name: 'IceWall Deployer',
    category: 'UTILITY',
    count: 1,
    maxStack: 5,
    weight: 1.5,
    slotType: 3,
    cost: 500,
    description: 'Deploys a 400HP reinforced ice barrier to absorb bullets.',
  },
  {
    key: 'MEDKIT',
    name: 'Military Surgical Medkit',
    category: 'MEDICAL',
    count: 1,
    maxStack: 5,
    weight: 0.7,
    slotType: 4,
    cost: 350,
    description: 'Emergency stimulant auto-injector that restores +60 HP instantly.',
  },
];

export function createStashItem(itemKey: 'M4A1' | 'PISTOL' | 'AMMO_556' | 'AMMO_45' | 'ICEWALL' | 'MEDKIT', customCount?: number): StashItem {
  const base = CATALOG_ITEMS.find((c) => c.key === itemKey)!;
  return {
    ...base,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    count: customCount ?? base.count,
  };
}

export const INITIAL_LOADOUT: PlayerLoadout = {
  slot1: null,
  slot2: null,
  slot3: null,
  slot4: null,
  slot5: null,
  rifleAmmoReserve: 0,
  pistolAmmoReserve: 0,
  backpack: [],
};

export const INITIAL_INVENTORY: PlayerInventory = {
  money: 10000,
  hasRifle: false,
  rifleAmmo: 0,
  rifleAmmoReserve: 0,
  hasPistol: false,
  pistolAmmo: 0,
  pistolAmmoReserve: 0,
  iceWalls: 0,
  medkits: 0,
  loadout: INITIAL_LOADOUT,
  stash: [],
};

// Convert PlayerLoadout into runtime PlayerInventory vitals
export function syncInventoryFromLoadout(money: number, loadout: PlayerLoadout, stash: StashItem[]): PlayerInventory {
  const hasRifle = loadout.slot1?.key === 'M4A1';
  const hasPistol = loadout.slot2?.key === 'PISTOL';
  const iceWalls = (loadout.slot3?.key === 'ICEWALL' ? (loadout.slot3.count || 1) : 0);
  const medkits = (loadout.slot4?.key === 'MEDKIT' ? (loadout.slot4.count || 1) : 0);

  // Reserve ammo calculated from loadout fields + any ammo in backpack
  let rifleReserve = loadout.rifleAmmoReserve || 0;
  let pistolReserve = loadout.pistolAmmoReserve || 0;

  for (const b of loadout.backpack) {
    if (b.key === 'AMMO_556') rifleReserve += b.count;
    if (b.key === 'AMMO_45') pistolReserve += b.count;
  }

  // Loaded ammo in chamber (up to 30 for rifle, 6 for pistol) if player brought ammo
  const rifleLoaded = hasRifle ? (rifleReserve > 0 ? Math.min(30, rifleReserve) : 0) : 0;
  const pistolLoaded = hasPistol ? (pistolReserve > 0 ? Math.min(6, pistolReserve) : 0) : 0;

  return {
    money,
    hasRifle,
    rifleAmmo: rifleLoaded,
    rifleAmmoReserve: Math.max(0, rifleReserve - rifleLoaded),
    hasPistol,
    pistolAmmo: pistolLoaded,
    pistolAmmoReserve: Math.max(0, pistolReserve - pistolLoaded),
    iceWalls,
    medkits,
    loadout,
    stash,
  };
}

// Storage Helpers
export function loadPlayerSavedData(playerId: string): PlayerInventory {
  if (typeof window === 'undefined') return INITIAL_INVENTORY;
  try {
    const raw = localStorage.getItem(`warz_saved_data_${playerId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.money === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading player data:', err);
  }
  return INITIAL_INVENTORY;
}

export function savePlayerSavedData(playerId: string, inv: PlayerInventory) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`warz_saved_data_${playerId}`, JSON.stringify(inv));
  } catch (err) {
    console.error('Error saving player data:', err);
  }
}
