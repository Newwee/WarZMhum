'use client';

import React, { useState } from 'react';
import { StashItem, PlayerLoadout, ItemCategory, PlayerInventory, WeaponType } from '@/types/game';
import {
  CATALOG_ITEMS,
  createStashItem,
  INITIAL_LOADOUT,
  syncInventoryFromLoadout,
  consolidateStash,
} from '@/lib/game/inventory-system';
import { sounds } from '@/lib/audio/sound-effects';
import {
  X,
  Crosshair,
  Shield,
  ShoppingBag,
  DollarSign,
  Package,
  RotateCcw,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface WarZInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: PlayerInventory;
  onUpdateInventory?: (newInv: PlayerInventory) => void;
  money?: number;
  loadout?: PlayerLoadout;
  stash?: StashItem[];
  onUpdateLoadoutAndStash?: (newMoney: number, newLoadout: PlayerLoadout, newStash: StashItem[]) => void;
  mode?: 'LOBBY' | 'IN_GAME';
  onEquipInGameWeapon?: (weaponKey: WeaponType) => void;
}

// Custom Tactical SVG Icon Renderer
function renderTacticalIcon(itemKey: string, category: string, className = 'w-6 h-6') {
  if (itemKey === 'SNIPER') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h4l2-3h7l1 2h6v2h-2v2h-3l-1-2H9l-2 3H3z" />
        <circle cx="12" cy="7" r="3" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="22" y1="14" x2="24" y2="14" />
      </svg>
    );
  }
  if (itemKey === 'SHOTGUN') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="11" width="18" height="3" rx="1" />
        <path d="M6 14v3h3l1-3" />
        <path d="M11 14h4v2h-4z" />
        <line x1="20" y1="12.5" x2="23" y2="12.5" />
      </svg>
    );
  }
  if (itemKey === 'KNIFE') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21l3-3m0 0l2 2 13-13a2 2 0 0 0-3-3L5 17l2 2z" />
        <line x1="7" y1="15" x2="9" y2="17" />
      </svg>
    );
  }
  if (itemKey === 'M4A1' || (category === 'WEAPONS' && itemKey.includes('M4'))) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13h4l2-3h5l1 2h6v2h-2v2h-3l-1-2H9l-2 3H3z" />
        <path d="M14 9l1-3h3v2" />
        <path d="M6 15l-1 4h3l1-3" />
      </svg>
    );
  }
  if (itemKey === 'PISTOL' || category === 'WEAPONS') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h13a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1h-8l-2 6H5l1-6H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
        <path d="M12 11h2" />
      </svg>
    );
  }
  if (itemKey === 'ICEWALL' || category === 'UTILITY') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 20 7 20 17 12 22 4 17 4 7 12 2" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="20" y1="7" x2="4" y2="17" />
        <line x1="4" y1="7" x2="20" y2="17" />
      </svg>
    );
  }
  if (itemKey === 'MEDKIT' || category === 'MEDICAL') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="15" rx="3" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="12" y1="10" x2="12" y2="16" />
        <line x1="9" y1="13" x2="15" y2="13" />
      </svg>
    );
  }
  if (itemKey.includes('AMMO') || category === 'AMMO') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <line x1="7" y1="4" x2="7" y2="7" />
        <line x1="12" y1="4" x2="12" y2="7" />
        <line x1="17" y1="4" x2="17" y2="7" />
        <circle cx="8" cy="13.5" r="1.5" />
        <circle cx="16" cy="13.5" r="1.5" />
      </svg>
    );
  }
  return <Package className={className} />;
}

export function WarZInventoryModal({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  money: propMoney,
  loadout: propLoadout,
  stash: propStash,
  onUpdateLoadoutAndStash,
  mode = 'LOBBY',
  onEquipInGameWeapon,
}: WarZInventoryModalProps) {
  const money = inventory ? inventory.money : (propMoney ?? 0);
  const loadout = inventory?.loadout || propLoadout || INITIAL_LOADOUT;
  const stash = inventory?.stash || propStash || [];

  const triggerUpdate = (newMoney: number, newLoadout: PlayerLoadout, newStash: StashItem[]) => {
    const consolidated = consolidateStash(newStash);
    if (onUpdateInventory && inventory) {
      const synced = syncInventoryFromLoadout(newMoney, newLoadout, consolidated);
      onUpdateInventory(synced);
    }
    if (onUpdateLoadoutAndStash) {
      onUpdateLoadoutAndStash(newMoney, newLoadout, consolidated);
    }
  };

  const [activeTab, setActiveTab] = useState<ItemCategory>('ALL');
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  if (!isOpen) return null;

  // Filter stash items by category
  const filteredStash = stash.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.category === activeTab;
  });

  // Calculate carried weight
  let totalWeight = 0;
  if (loadout.slot1) totalWeight += loadout.slot1.weight;
  if (loadout.slot2) totalWeight += loadout.slot2.weight;
  if (loadout.slot3) totalWeight += loadout.slot3.weight * (loadout.slot3.count || 1);
  if (loadout.slot4) totalWeight += loadout.slot4.weight * (loadout.slot4.count || 1);
  if (loadout.slot5) totalWeight += loadout.slot5.weight * (loadout.slot5.count || 1);
  totalWeight += (loadout.rifleAmmoReserve || 0) * 0.01;
  totalWeight += (loadout.pistolAmmoReserve || 0) * 0.01;
  for (const b of loadout.backpack) {
    totalWeight += b.weight * (b.count || 1);
  }

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, source: 'STASH' | 'SLOT' | 'BACKPACK', item: StashItem, slotIndex?: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source, itemId: item.id, itemKey: item.key, slotIndex }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSlot = (e: React.DragEvent, targetSlot: 1 | 2 | 3 | 4 | 5) => {
    e.preventDefault();
    if (mode === 'IN_GAME') return;

    const dataRaw = e.dataTransfer.getData('text/plain');
    if (!dataRaw) return;
    try {
      const data = JSON.parse(dataRaw);
      if (data.source === 'STASH') {
        const itemToEquip = stash.find((s) => s.id === data.itemId);
        if (itemToEquip) {
          equipItemToSlot(itemToEquip, targetSlot);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropOnStash = (e: React.DragEvent) => {
    e.preventDefault();
    if (mode === 'IN_GAME') return;

    const dataRaw = e.dataTransfer.getData('text/plain');
    if (!dataRaw) return;
    try {
      const data = JSON.parse(dataRaw);
      if (data.source === 'SLOT') {
        unequipSlot(data.slotIndex as 1 | 2 | 3 | 4 | 5);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Equip Item from Stash to Slot (UNLIMITED STACKING SUPPORT)
  const equipItemToSlot = (item: StashItem, targetSlot?: 1 | 2 | 3 | 4 | 5) => {
    if (mode === 'IN_GAME') return;

    const slotNum = targetSlot || (item.slotType === 'AMMO' ? undefined : (item.slotType as 1 | 2 | 3 | 4 | 5));
    let newStash = stash.filter((s) => s.id !== item.id);
    const newLoadout = { ...loadout, backpack: [...loadout.backpack] };

    sounds.playSwitchWeapon();

    if (item.key === 'AMMO_556') {
      newLoadout.rifleAmmoReserve = (newLoadout.rifleAmmoReserve || 0) + (item.count || 30);
    } else if (item.key === 'AMMO_45') {
      newLoadout.pistolAmmoReserve = (newLoadout.pistolAmmoReserve || 0) + (item.count || 12);
    } else if (item.key === 'AMMO_SNIPER') {
      newLoadout.sniperAmmoReserve = (newLoadout.sniperAmmoReserve || 0) + (item.count || 10);
    } else if (item.key === 'AMMO_SHOTGUN') {
      newLoadout.shotgunAmmoReserve = (newLoadout.shotgunAmmoReserve || 0) + (item.count || 16);
    } else if (slotNum === 1 || item.key === 'M4A1' || item.key === 'SNIPER' || item.key === 'SHOTGUN') {
      if (newLoadout.slot1) newStash.push(newLoadout.slot1);
      newLoadout.slot1 = { ...item };
    } else if (slotNum === 2 || (item.key === 'PISTOL' && !newLoadout.slot2)) {
      if (newLoadout.slot2) newStash.push(newLoadout.slot2);
      newLoadout.slot2 = { ...item };
    } else if (slotNum === 3 || item.key === 'ICEWALL') {
      // Slot 3 (Utility / IceWall): Unlimited Stacking
      if (newLoadout.slot3 && newLoadout.slot3.key === item.key) {
        newLoadout.slot3 = {
          ...newLoadout.slot3,
          count: (newLoadout.slot3.count || 1) + (item.count || 1),
        };
      } else {
        if (newLoadout.slot3) newStash.push(newLoadout.slot3);
        newLoadout.slot3 = { ...item };
      }
    } else if (slotNum === 4 || item.key === 'MEDKIT') {
      // Slot 4 (Medical / Medkit): Unlimited Stacking
      if (newLoadout.slot4 && newLoadout.slot4.key === item.key) {
        newLoadout.slot4 = {
          ...newLoadout.slot4,
          count: (newLoadout.slot4.count || 1) + (item.count || 1),
        };
      } else {
        if (newLoadout.slot4) newStash.push(newLoadout.slot4);
        newLoadout.slot4 = { ...item };
      }
    } else if (slotNum === 5 || item.key === 'KNIFE') {
      // Slot 5 (Melee / Knife / Misc): Unlimited Stacking if matching key
      if (newLoadout.slot5 && newLoadout.slot5.key === item.key) {
        newLoadout.slot5 = {
          ...newLoadout.slot5,
          count: (newLoadout.slot5.count || 1) + (item.count || 1),
        };
      } else {
        if (newLoadout.slot5) newStash.push(newLoadout.slot5);
        newLoadout.slot5 = { ...item };
      }
    } else {
      // Put into backpack with unlimited stacking if stackable
      const existingInBackpack = newLoadout.backpack.find(
        (b) => b.key === item.key && (item.category === 'UTILITY' || item.category === 'MEDICAL' || item.category === 'AMMO')
      );
      if (existingInBackpack) {
        existingInBackpack.count = (existingInBackpack.count || 1) + (item.count || 1);
      } else {
        newLoadout.backpack.push({ ...item });
      }
    }

    newStash = consolidateStash(newStash);
    triggerUpdate(money, newLoadout, newStash);
  };

  // Unequip slot back to stash (WITH AUTO-MERGE INTO EXISTING STASH STACKS)
  const unequipSlot = (slotNum: 1 | 2 | 3 | 4 | 5) => {
    if (mode === 'IN_GAME') return;

    const newLoadout = { ...loadout };
    let newStash = [...stash];
    let removedItem: StashItem | null = null;

    if (slotNum === 1 && newLoadout.slot1) {
      removedItem = newLoadout.slot1;
      newLoadout.slot1 = null;
    } else if (slotNum === 2 && newLoadout.slot2) {
      removedItem = newLoadout.slot2;
      newLoadout.slot2 = null;
    } else if (slotNum === 3 && newLoadout.slot3) {
      removedItem = newLoadout.slot3;
      newLoadout.slot3 = null;
    } else if (slotNum === 4 && newLoadout.slot4) {
      removedItem = newLoadout.slot4;
      newLoadout.slot4 = null;
    } else if (slotNum === 5 && newLoadout.slot5) {
      removedItem = newLoadout.slot5;
      newLoadout.slot5 = null;
    }

    if (removedItem) {
      sounds.playSwitchWeapon();
      const existing = newStash.find(
        (s) => s.key === removedItem!.key && (removedItem!.category === 'UTILITY' || removedItem!.category === 'MEDICAL' || removedItem!.category === 'AMMO')
      );
      if (existing) {
        existing.count = (existing.count || 1) + (removedItem.count || 1);
      } else {
        newStash.push(removedItem);
      }
      newStash = consolidateStash(newStash);
      triggerUpdate(money, newLoadout, newStash);
    }
  };

  // Quick Action: Unequip ALL into Stash (AUTO-MERGE EVERYTHING)
  const handleQuickUnequipAll = () => {
    if (mode === 'IN_GAME') return;

    let newStash = [...stash];
    if (loadout.slot1) newStash.push(loadout.slot1);
    if (loadout.slot2) newStash.push(loadout.slot2);
    if (loadout.slot3) newStash.push(loadout.slot3);
    if (loadout.slot4) newStash.push(loadout.slot4);
    if (loadout.slot5) newStash.push(loadout.slot5);

    // Convert reserve ammo back into ammo boxes in stash
    if (loadout.rifleAmmoReserve > 0) {
      newStash.push(createStashItem('AMMO_556', loadout.rifleAmmoReserve));
    }
    if (loadout.pistolAmmoReserve > 0) {
      newStash.push(createStashItem('AMMO_45', loadout.pistolAmmoReserve));
    }
    if (loadout.sniperAmmoReserve > 0) {
      newStash.push(createStashItem('AMMO_SNIPER', loadout.sniperAmmoReserve));
    }
    if (loadout.shotgunAmmoReserve > 0) {
      newStash.push(createStashItem('AMMO_SHOTGUN', loadout.shotgunAmmoReserve));
    }

    for (const b of loadout.backpack) {
      newStash.push(b);
    }

    newStash = consolidateStash(newStash);

    const cleanLoadout: PlayerLoadout = {
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

    sounds.playSwitchWeapon();
    triggerUpdate(money, cleanLoadout, newStash);
  };

  // Buy Item from Stash Marketplace (AUTO-MERGE INTO EXISTING STASH STACK)
  const handleBuy = (catalogKey: StashItem['key'], cost: number) => {
    if (money < cost) {
      sounds.playBuyError();
      return;
    }
    sounds.playBuySuccess();
    const newItem = createStashItem(catalogKey);
    let newStash = [...stash];

    // Merge stackable items directly so user doesn't get cluttered separate cards
    if (newItem.category === 'UTILITY' || newItem.category === 'MEDICAL' || newItem.category === 'AMMO') {
      const existing = newStash.find((s) => s.key === catalogKey);
      if (existing) {
        existing.count = (existing.count || 1) + (newItem.count || 1);
      } else {
        newStash.push(newItem);
      }
    } else {
      newStash.push(newItem);
    }

    newStash = consolidateStash(newStash);
    triggerUpdate(money - cost, loadout, newStash);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-2 sm:p-5 animate-in fade-in duration-200 select-none">
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl bg-[#090c0a] border-2 border-red-700/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] overflow-hidden flex flex-col max-h-[96vh] ring-1 ring-white/10">
        {/* ================= TOP HEADER BAR ================= */}
        <header className="flex items-center justify-between px-5 sm:px-7 py-3.5 bg-black/95 border-b border-zinc-800/80">
          <div className="flex items-center gap-5 sm:gap-7">
            {/* Survivors Glowing Logo */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-widest bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                SURVIVORS
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-red-500/30 text-zinc-300">
                WARZ LOADOUT &amp; DEPOT
              </span>
            </div>

            {/* Navigation Tabs (Lobby Mode Only) */}
            {mode === 'LOBBY' && (
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => setIsStoreOpen(false)}
                  className={`px-3.5 py-1.5 rounded-xl font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    !isStoreOpen
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>LOADOUT &amp; STASH</span>
                </button>

                <button
                  onClick={() => setIsStoreOpen(true)}
                  className={`px-3.5 py-1.5 rounded-xl font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    isStoreOpen
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                      : 'text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-900/50'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>SUPPLY MARKETPLACE</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Header: Cash Vault & Close */}
          <div className="flex items-center gap-3">
            {/* Prominent Bank Cash Badge */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-950/90 to-zinc-950 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/80 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-mono font-bold text-emerald-400/80 leading-none">PMC BANK VAULT</span>
                <span className="text-sm sm:text-base font-mono font-black text-emerald-300 leading-tight">
                  ${money.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ================= MAIN CONTENT BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ================= LEFT SIDE: EQUIPPED LOADOUT & BACKPACK ================= */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* SECTION 1: EQUIPPED WEAPONRY (Slots 1 & 2) */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-xs font-mono font-black text-red-400 tracking-widest uppercase flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                  EQUIPPED WEAPONRY
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {mode === 'IN_GAME' ? 'DEPLOYED IN RAID' : 'CLICK OR DRAG TO EQUIP'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Slot 1: Primary Weapon (Crimson Glow) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 1)}
                  onClick={() => {
                    if (mode === 'IN_GAME' && loadout.slot1) {
                      const wType: WeaponType = loadout.slot1.key === 'SNIPER' ? 'SNIPER' : loadout.slot1.key === 'SHOTGUN' ? 'SHOTGUN' : 'RIFLE';
                      onEquipInGameWeapon?.(wType);
                    } else {
                      unequipSlot(1);
                    }
                  }}
                  className={`h-32 rounded-xl border-2 flex flex-col justify-between p-3 transition-all cursor-pointer relative overflow-hidden group ${
                    loadout.slot1
                      ? 'bg-gradient-to-br from-red-950/60 via-zinc-900/90 to-black border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:border-red-400'
                      : 'bg-zinc-900/20 border-dashed border-red-900/40 hover:border-red-500/60'
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-950/90 border border-red-600/60 text-red-300 font-black">
                      SLOT [1] PRIMARY
                    </span>
                    {loadout.slot1 && (
                      <span className="text-[10px] font-mono font-bold text-red-400">{loadout.slot1.weight} KG</span>
                    )}
                  </div>

                  {loadout.slot1 ? (
                    <div className="z-10 mt-1">
                      <div className="flex items-center gap-2 text-red-400 mb-1">
                        {renderTacticalIcon(loadout.slot1.key, 'WEAPONS', 'w-6 h-6 text-red-400')}
                        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-tighter">
                          {loadout.slot1.key === 'SNIPER' ? '.338 LAPUA' : loadout.slot1.key === 'SHOTGUN' ? '12-GAUGE BUCK' : '5.56 NATO'}
                        </span>
                      </div>
                      <div className="text-sm font-black font-mono text-white truncate drop-shadow">
                        {loadout.slot1.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-700/50">
                          RESERVE: {loadout.slot1.key === 'SNIPER' ? (loadout.sniperAmmoReserve || 0) : loadout.slot1.key === 'SHOTGUN' ? (loadout.shotgunAmmoReserve || 0) : (loadout.rifleAmmoReserve || 0)} RNDS
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-xs text-red-500/60 my-auto flex flex-col items-center gap-1">
                      <Crosshair className="w-5 h-5 text-red-500/40" />
                      <span>+ EMPTY PRIMARY</span>
                    </div>
                  )}
                </div>

                {/* Slot 2: Secondary Sidearm (Amber Glow) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 2)}
                  onClick={() => {
                    if (mode === 'IN_GAME' && loadout.slot2) {
                      const wType: WeaponType = loadout.slot2.key === 'KNIFE' ? 'KNIFE' : 'PISTOL';
                      onEquipInGameWeapon?.(wType);
                    } else {
                      unequipSlot(2);
                    }
                  }}
                  className={`h-32 rounded-xl border-2 flex flex-col justify-between p-3 transition-all cursor-pointer relative overflow-hidden group ${
                    loadout.slot2
                      ? 'bg-gradient-to-br from-amber-950/60 via-zinc-900/90 to-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:border-amber-400'
                      : 'bg-zinc-900/20 border-dashed border-amber-900/40 hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-600/60 text-amber-300 font-black">
                      SLOT [2] SIDEARM
                    </span>
                    {loadout.slot2 && (
                      <span className="text-[10px] font-mono font-bold text-amber-400">{loadout.slot2.weight} KG</span>
                    )}
                  </div>

                  {loadout.slot2 ? (
                    <div className="z-10 mt-1">
                      <div className="flex items-center gap-2 text-amber-400 mb-1">
                        {renderTacticalIcon(loadout.slot2.key, 'WEAPONS', 'w-6 h-6 text-amber-400')}
                        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-tighter">
                          {loadout.slot2.key === 'KNIFE' ? 'COMBAT BLADE' : '.45 ACP'}
                        </span>
                      </div>
                      <div className="text-sm font-black font-mono text-white truncate drop-shadow">
                        {loadout.slot2.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                          {loadout.slot2.key === 'KNIFE' ? 'SILENT MELEE' : `RESERVE: ${loadout.pistolAmmoReserve || 0} RNDS`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-xs text-amber-500/60 my-auto flex flex-col items-center gap-1">
                      <Crosshair className="w-5 h-5 text-amber-500/40" />
                      <span>+ EMPTY SIDEARM</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: QUICKSLOTS [3, 4, 5] (UNLIMITED STACKING HIGHLIGHT) */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="border-b border-zinc-800/80 pb-2 flex justify-between items-center">
                <span className="text-xs font-mono font-black text-zinc-300 tracking-widest uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  HOTBAR QUICKSLOTS [3, 4, 5]
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  UNLIMITED STACKING
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Slot 3: Utility (IceWall) - Glowing Cyan */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 3)}
                  onClick={() => unequipSlot(3)}
                  className={`h-28 rounded-xl border-2 flex flex-col justify-between p-2.5 transition-all cursor-pointer relative overflow-hidden ${
                    loadout.slot3
                      ? 'bg-gradient-to-br from-cyan-950/70 via-zinc-900/90 to-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:border-cyan-300'
                      : 'bg-zinc-900/20 border-dashed border-cyan-900/40 hover:border-cyan-500/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-cyan-300 font-black px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-600/50">
                      [3] UTILITY
                    </span>
                    {loadout.slot3 && (
                      <span className="text-xs font-mono font-black text-black bg-cyan-400 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                        x{loadout.slot3.count || 1}
                      </span>
                    )}
                  </div>

                  {loadout.slot3 ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-cyan-300 mb-0.5">
                        {renderTacticalIcon('ICEWALL', 'UTILITY', 'w-5 h-5 text-cyan-400')}
                        <span className="text-[10px] font-mono text-cyan-200 truncate font-black">
                          {loadout.slot3.name}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-cyan-400/90">400 HP BARRIER</div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-[10px] text-cyan-600 my-auto">+ EMPTY ICEWALL</div>
                  )}
                </div>

                {/* Slot 4: Heal (Medkit) - Glowing Emerald */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 4)}
                  onClick={() => unequipSlot(4)}
                  className={`h-28 rounded-xl border-2 flex flex-col justify-between p-2.5 transition-all cursor-pointer relative overflow-hidden ${
                    loadout.slot4
                      ? 'bg-gradient-to-br from-emerald-950/70 via-zinc-900/90 to-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:border-emerald-300'
                      : 'bg-zinc-900/20 border-dashed border-emerald-900/40 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-emerald-300 font-black px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-600/50">
                      [4] HEAL
                    </span>
                    {loadout.slot4 && (
                      <span className="text-xs font-mono font-black text-black bg-emerald-400 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]">
                        x{loadout.slot4.count || 1}
                      </span>
                    )}
                  </div>

                  {loadout.slot4 ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-300 mb-0.5">
                        {renderTacticalIcon('MEDKIT', 'MEDICAL', 'w-5 h-5 text-emerald-400')}
                        <span className="text-[10px] font-mono text-emerald-200 truncate font-black">
                          {loadout.slot4.name}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-emerald-400/90">BURST +60 HP</div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-[10px] text-emerald-600 my-auto">+ EMPTY MEDKIT</div>
                  )}
                </div>

                {/* Slot 5: Misc - Glowing Purple */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 5)}
                  onClick={() => unequipSlot(5)}
                  className={`h-28 rounded-xl border-2 flex flex-col justify-between p-2.5 transition-all cursor-pointer relative overflow-hidden ${
                    loadout.slot5
                      ? 'bg-gradient-to-br from-purple-950/70 via-zinc-900/90 to-black border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:border-purple-300'
                      : 'bg-zinc-900/20 border-dashed border-purple-900/40 hover:border-purple-500/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-purple-300 font-black px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-600/50">
                      [5] MISC
                    </span>
                    {loadout.slot5 && (
                      <span className="text-xs font-mono font-black text-black bg-purple-400 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                        x{loadout.slot5.count || 1}
                      </span>
                    )}
                  </div>

                  {loadout.slot5 ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-purple-300 mb-0.5">
                        {renderTacticalIcon(loadout.slot5.key, loadout.slot5.category, 'w-5 h-5 text-purple-400')}
                        <span className="text-[10px] font-mono text-purple-200 truncate font-black">
                          {loadout.slot5.name}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-purple-400/90">{loadout.slot5.weight} KG</div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-[10px] text-purple-600 my-auto">+ EMPTY MISC</div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: MILITARY RUCK BACKPACK & ACTION */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-xs font-mono font-black text-zinc-300 tracking-widest uppercase flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  RUCK WEIGHT &amp; AMMO POCKETS
                </span>
                <span className="text-xs font-mono font-bold">
                  WEIGHT:{' '}
                  <strong className={totalWeight > 50 ? 'text-red-400' : 'text-emerald-400'}>
                    {totalWeight.toFixed(1)} KG
                  </strong>{' '}
                  / 60 KG
                </span>
              </div>

              {/* Weight Visual Bar */}
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    totalWeight > 50 ? 'bg-red-500' : totalWeight > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (totalWeight / 60) * 100))}%` }}
                />
              </div>

              {/* Reserve Ammo Pocket Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-900/90 border border-red-700/40 flex justify-between items-center">
                  <span className="text-zinc-400 text-[10px] font-bold">5.56mm NATO:</span>
                  <span className="font-black text-red-400 text-xs">{loadout.rifleAmmoReserve || 0} Rnds</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/90 border border-amber-700/40 flex justify-between items-center">
                  <span className="text-zinc-400 text-[10px] font-bold">.45 ACP:</span>
                  <span className="font-black text-amber-400 text-xs">{loadout.pistolAmmoReserve || 0} Rnds</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/90 border border-emerald-700/40 flex justify-between items-center">
                  <span className="text-zinc-400 text-[10px] font-bold">.338 Lapua:</span>
                  <span className="font-black text-emerald-400 text-xs">{loadout.sniperAmmoReserve || 0} Rnds</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/90 border border-orange-700/40 flex justify-between items-center">
                  <span className="text-zinc-400 text-[10px] font-bold">12-Ga Buck:</span>
                  <span className="font-black text-orange-400 text-xs">{loadout.shotgunAmmoReserve || 0} Rnds</span>
                </div>
              </div>

              {/* CENTERPIECE ACTION BUTTON: QUICK UNEQUIP ALL TO STASH */}
              {mode === 'LOBBY' && (
                <button
                  onClick={handleQuickUnequipAll}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black font-mono text-xs tracking-wider rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer uppercase"
                >
                  <RotateCcw className="w-4 h-4 text-black stroke-[3]" />
                  <span>QUICK UNEQUIP ALL TO STASH (เก็บของทั้งหมดเข้าคลัง)</span>
                </button>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: GLOBAL INVENTORY / STASH ================= */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {mode === 'IN_GAME' ? (
              // In-Game Mode: Stash is locked in safe outpost
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto h-full shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black font-mono text-white tracking-wider">
                    IN-RAID TACTICAL INVENTORY
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 max-w-md mt-2 leading-relaxed">
                    Global Stash &amp; Supply Marketplace are locked in the safe outpost during deployment. Reach the Green Extraction Zone to safely escape with your harvested gear!
                  </p>
                </div>
              </div>
            ) : isStoreOpen ? (
              // SUPPLY MARKETPLACE
              <div className="bg-zinc-950/90 border-2 border-amber-600/50 rounded-2xl p-5 flex flex-col justify-between h-full space-y-4 shadow-2xl">
                <div className="border-b border-zinc-800/80 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-mono font-black text-white uppercase tracking-wider">
                      SUPPLY MARKETPLACE // BUY INTO STASH
                    </span>
                  </div>
                  <button
                    onClick={() => setIsStoreOpen(false)}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 underline font-black cursor-pointer flex items-center gap-1"
                  >
                    <span>&larr; BACK TO STASH</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto max-h-[58vh] pr-1">
                  {CATALOG_ITEMS.map((item) => {
                    const canAfford = money >= item.cost;
                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-xl bg-zinc-900/90 border-2 border-zinc-800 hover:border-amber-500/60 flex flex-col justify-between transition-all group shadow-md"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-black uppercase">
                              {item.category}
                            </span>
                            <span className="text-base font-mono font-black text-emerald-400 drop-shadow">
                              ${item.cost.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 my-1">
                            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400">
                              {renderTacticalIcon(item.key, item.category, 'w-6 h-6')}
                            </div>
                            <h4 className="text-sm font-black font-mono text-white leading-tight">
                              {item.name}
                            </h4>
                          </div>

                          <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{item.description}</p>
                        </div>

                        <button
                          onClick={() => handleBuy(item.key, item.cost)}
                          disabled={!canAfford}
                          className={`w-full mt-4 py-2.5 font-mono text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            canAfford
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95'
                              : 'bg-zinc-800/80 text-zinc-600 border border-zinc-700/40 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>PURCHASE (${item.cost.toLocaleString()})</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // GLOBAL INVENTORY STASH GRID
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropOnStash}
                className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-5 flex flex-col h-full space-y-4 shadow-2xl"
              >
                {/* Category Filter Tabs */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {(['ALL', 'WEAPONS', 'AMMO', 'MEDICAL', 'UTILITY'] as ItemCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                          activeTab === cat
                            ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] border border-red-400'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-mono font-bold text-zinc-400">
                    STASH SLOTS: <strong className="text-white">{stash.length}</strong>
                  </span>
                </div>

                {/* Stash Grid Cells */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto max-h-[58vh] p-1">
                  {filteredStash.map((item) => {
                    const isWeapon = item.category === 'WEAPONS';
                    const isUtility = item.category === 'UTILITY';
                    const isMedical = item.category === 'MEDICAL';
                    const isAmmo = item.category === 'AMMO';

                    const borderStyle = isWeapon
                      ? 'border-red-600/70 hover:border-red-400 shadow-red-950/40'
                      : isUtility
                      ? 'border-cyan-500/70 hover:border-cyan-400 shadow-cyan-950/40'
                      : isMedical
                      ? 'border-emerald-500/70 hover:border-emerald-400 shadow-emerald-950/40'
                      : 'border-amber-500/70 hover:border-amber-400 shadow-amber-950/40';

                    const iconColor = isWeapon
                      ? 'text-red-400'
                      : isUtility
                      ? 'text-cyan-400'
                      : isMedical
                      ? 'text-emerald-400'
                      : 'text-amber-400';

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'STASH', item)}
                        onClick={() => equipItemToSlot(item)}
                        className={`aspect-square rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-2 ${borderStyle} p-2.5 flex flex-col justify-between transition-all cursor-pointer relative group shadow-lg hover:scale-105 active:scale-95`}
                        title={`${item.name}\n${item.description}\nClick or drag to equip`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold uppercase">
                            {item.key.includes('AMMO') ? 'AMMO' : item.key}
                          </span>
                          {/* Top-Right High Contrast Stack Badge */}
                          {item.count > 1 && (
                            <span className="text-xs font-mono font-black text-black bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 rounded-full shadow-md border border-amber-200">
                              x{item.count}
                            </span>
                          )}
                        </div>

                        {/* Tactical SVG Icon Center */}
                        <div className="flex items-center justify-center my-auto">
                          {renderTacticalIcon(item.key, item.category, `w-8 h-8 ${iconColor}`)}
                        </div>

                        <div>
                          <div className="text-[11px] font-black font-mono text-white leading-tight truncate">
                            {item.name}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-500 flex justify-between mt-0.5">
                            <span>{item.weight}kg</span>
                            <span className="text-emerald-400 font-bold group-hover:inline hidden">EQUIP &rarr;</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Fillers */}
                  {Array.from({ length: Math.max(0, 20 - filteredStash.length) }).map((_, idx) => (
                    <div
                      key={`empty_${idx}`}
                      className="aspect-square rounded-2xl bg-zinc-900/10 border-2 border-dashed border-zinc-800/60 flex items-center justify-center font-mono text-xs text-zinc-800 select-none"
                    >
                      &bull;
                    </div>
                  ))}
                </div>

                {/* Stash Footer Prompt */}
                <div className="pt-3 border-t border-zinc-900 text-[11px] font-mono text-zinc-400 flex justify-between items-center">
                  <span>Click or drag item into Slot 1-5 to equip</span>
                  <button
                    onClick={() => setIsStoreOpen(true)}
                    className="text-amber-400 hover:text-amber-300 font-black underline cursor-pointer flex items-center gap-1"
                  >
                    <span>+ BUY MORE SUPPLIES</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
