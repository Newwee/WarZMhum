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
    description: 'Full-auto 5.56mm NATO assault rifle with 30-round mag and iron sights.',
  },
  {
    key: 'SNIPER',
    name: 'AWM Tactical Sniper',
    category: 'WEAPONS',
    count: 1,
    maxStack: 1,
    weight: 6.2,
    slotType: 1,
    cost: 3500,
    description: 'High-caliber .338 Lapua bolt-action sniper rifle with high-power telescopic scope.',
  },
  {
    key: 'SHOTGUN',
    name: 'Mossberg 590 Shotgun',
    category: 'WEAPONS',
    count: 1,
    maxStack: 1,
    weight: 3.8,
    slotType: 1,
    cost: 1800,
    description: 'Heavy 12-Gauge pump-action shotgun with devastating 8-pellet spread at close range.',
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
    key: 'KNIFE',
    name: 'Tactical Combat Knife',
    category: 'WEAPONS',
    count: 1,
    maxStack: 1,
    weight: 0.4,
    slotType: 5,
    cost: 400,
    description: 'Silent razor-sharp tactical blade with high critical slash damage.',
  },
  {
    key: 'AMMO_556',
    name: '5.56mm Ammo Box (30 Rnds)',
    category: 'AMMO',
    count: 30,
    maxStack: 999999,
    weight: 0.01,
    slotType: 'AMMO',
    cost: 200,
    description: 'Standard 5.56x45mm military surplus rounds for M4A1.',
  },
  {
    key: 'AMMO_45',
    name: '.45 ACP Ammo Box (12 Rnds)',
    category: 'AMMO',
    count: 12,
    maxStack: 999999,
    weight: 0.01,
    slotType: 'AMMO',
    cost: 100,
    description: 'Heavy .45 ACP handgun rounds for .45 Thunder Revolver.',
  },
  {
    key: 'AMMO_SNIPER',
    name: '.338 Lapua Ammo (10 Rnds)',
    category: 'AMMO',
    count: 10,
    maxStack: 999999,
    weight: 0.01,
    slotType: 'AMMO',
    cost: 300,
    description: 'High-velocity armor-piercing .338 Lapua Magnum sniper rounds.',
  },
  {
    key: 'AMMO_SHOTGUN',
    name: '12-Gauge Buckshot (16 Rnds)',
    category: 'AMMO',
    count: 16,
    maxStack: 999999,
    weight: 0.01,
    slotType: 'AMMO',
    cost: 250,
    description: 'Heavy 12-Gauge 00-buckshot shells for tactical shotguns.',
  },
  {
    key: 'ICEWALL',
    name: 'IceWall Deployer',
    category: 'UTILITY',
    count: 1,
    maxStack: 999999,
    weight: 0.1,
    slotType: 3,
    cost: 500,
    description: 'Deploys a 400HP reinforced ice barrier to absorb bullets. Unlimited stackable.',
  },
  {
    key: 'MEDKIT',
    name: 'Military Surgical Medkit',
    category: 'MEDICAL',
    count: 1,
    maxStack: 999999,
    weight: 0.1,
    slotType: 4,
    cost: 350,
    description: 'Emergency stimulant auto-injector that restores +60 HP instantly. Unlimited stackable.',
  },
];

export function createStashItem(itemKey: StashItem['key'], customCount?: number): StashItem {
  const base = CATALOG_ITEMS.find((c) => c.key === itemKey)!;
  return {
    ...base,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    count: customCount ?? base.count,
  };
}

// Auto-merge duplicate stackable items in stash
export function consolidateStash(stash: StashItem[]): StashItem[] {
  const merged: StashItem[] = [];
  for (const item of stash) {
    if (item.category === 'UTILITY' || item.category === 'MEDICAL' || item.category === 'AMMO') {
      const existing = merged.find((m) => m.key === item.key);
      if (existing) {
        existing.count += (item.count || 1);
      } else {
        merged.push({ ...item });
      }
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
}

export const INITIAL_LOADOUT: PlayerLoadout = {
  slot1: null,
  slot2: null,
  slot3: null,
  slot4: null,
  slot5: null,
  rifleAmmoReserve: 0,
  pistolAmmoReserve: 0,
  sniperAmmoReserve: 0,
  shotgunAmmoReserve: 0,
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
  hasSniper: false,
  sniperAmmo: 0,
  sniperAmmoReserve: 0,
  hasShotgun: false,
  shotgunAmmo: 0,
  shotgunAmmoReserve: 0,
  hasKnife: false,
  iceWalls: 0,
  medkits: 0,
  loadout: INITIAL_LOADOUT,
  stash: [],
};

// Convert PlayerLoadout into runtime PlayerInventory vitals
export function syncInventoryFromLoadout(money: number, loadout: PlayerLoadout, stash: StashItem[]): PlayerInventory {
  const hasRifle = loadout.slot1?.key === 'M4A1';
  const hasSniper = loadout.slot1?.key === 'SNIPER';
  const hasShotgun = loadout.slot1?.key === 'SHOTGUN';
  const hasPistol = loadout.slot2?.key === 'PISTOL';
  const hasKnife = loadout.slot2?.key === 'KNIFE' || loadout.slot5?.key === 'KNIFE';

  // Unlimited stacking for Utility and Heal items across quickslots and backpack
  let iceWalls = 0;
  if (loadout.slot3?.key === 'ICEWALL') iceWalls += (loadout.slot3.count || 1);
  if (loadout.slot5?.key === 'ICEWALL') iceWalls += (loadout.slot5.count || 1);
  for (const b of loadout.backpack) {
    if (b.key === 'ICEWALL') iceWalls += (b.count || 1);
  }

  let medkits = 0;
  if (loadout.slot4?.key === 'MEDKIT') medkits += (loadout.slot4.count || 1);
  if (loadout.slot5?.key === 'MEDKIT') medkits += (loadout.slot5.count || 1);
  for (const b of loadout.backpack) {
    if (b.key === 'MEDKIT') medkits += (b.count || 1);
  }

  // Reserve ammo calculated from loadout fields + any ammo in backpack
  let rifleReserve = loadout.rifleAmmoReserve || 0;
  let pistolReserve = loadout.pistolAmmoReserve || 0;
  let sniperReserve = loadout.sniperAmmoReserve || 0;
  let shotgunReserve = loadout.shotgunAmmoReserve || 0;

  for (const b of loadout.backpack) {
    if (b.key === 'AMMO_556') rifleReserve += (b.count || 1);
    if (b.key === 'AMMO_45') pistolReserve += (b.count || 1);
    if (b.key === 'AMMO_SNIPER') sniperReserve += (b.count || 1);
    if (b.key === 'AMMO_SHOTGUN') shotgunReserve += (b.count || 1);
  }

  // Loaded chamber ammo (M4A1: 30, Pistol: 6, Sniper: 5, Shotgun: 8)
  const rifleLoaded = hasRifle ? (rifleReserve > 0 ? Math.min(30, rifleReserve) : 0) : 0;
  const pistolLoaded = hasPistol ? (pistolReserve > 0 ? Math.min(6, pistolReserve) : 0) : 0;
  const sniperLoaded = hasSniper ? (sniperReserve > 0 ? Math.min(5, sniperReserve) : 0) : 0;
  const shotgunLoaded = hasShotgun ? (shotgunReserve > 0 ? Math.min(8, shotgunReserve) : 0) : 0;

  return {
    money,
    hasRifle,
    rifleAmmo: rifleLoaded,
    rifleAmmoReserve: Math.max(0, rifleReserve - rifleLoaded),
    hasPistol,
    pistolAmmo: pistolLoaded,
    pistolAmmoReserve: Math.max(0, pistolReserve - pistolLoaded),
    hasSniper,
    sniperAmmo: sniperLoaded,
    sniperAmmoReserve: Math.max(0, sniperReserve - sniperLoaded),
    hasShotgun,
    shotgunAmmo: shotgunLoaded,
    shotgunAmmoReserve: Math.max(0, shotgunReserve - shotgunLoaded),
    hasKnife,
    iceWalls,
    medkits,
    loadout,
    stash: consolidateStash(stash),
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
