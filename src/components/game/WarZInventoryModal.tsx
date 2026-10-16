'use client';

import React, { useState } from 'react';
import { StashItem, PlayerLoadout, ItemCategory, PlayerInventory } from '@/types/game';
import { CATALOG_ITEMS, createStashItem, INITIAL_LOADOUT, syncInventoryFromLoadout } from '@/lib/game/inventory-system';
import { sounds } from '@/lib/audio/sound-effects';
import {
  X,
  Crosshair,
  Shield,
  PlusCircle,
  ShoppingBag,
  DollarSign,
  Package,
  Trash2,
  ArrowRightLeft,
  Zap,
  Check,
  RotateCcw,
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
  onEquipInGameWeapon?: (weaponKey: 'RIFLE' | 'PISTOL' | 'ICEWALL' | 'MEDKIT' | 'UNARMED') => void;
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
    if (onUpdateInventory && inventory) {
      const synced = syncInventoryFromLoadout(newMoney, newLoadout, newStash);
      onUpdateInventory(synced);
    }
    if (onUpdateLoadoutAndStash) {
      onUpdateLoadoutAndStash(newMoney, newLoadout, newStash);
    }
  };
  const [activeTab, setActiveTab] = useState<ItemCategory>('ALL');
  const [selectedStashItem, setSelectedStashItem] = useState<StashItem | null>(null);
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
  totalWeight += (loadout.rifleAmmoReserve / 30) * 0.8;
  totalWeight += (loadout.pistolAmmoReserve / 12) * 0.5;
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
    if (mode === 'IN_GAME') return; // Cannot pull from Stash while in-game

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

  // Equip Item from Stash to Slot
  const equipItemToSlot = (item: StashItem, targetSlot?: 1 | 2 | 3 | 4 | 5) => {
    if (mode === 'IN_GAME') return;

    const slotNum = targetSlot || (item.slotType === 'AMMO' ? undefined : (item.slotType as 1 | 2 | 3 | 4 | 5));
    const newStash = stash.filter((s) => s.id !== item.id);
    const newLoadout = { ...loadout, backpack: [...loadout.backpack] };

    sounds.playSwitchWeapon();

    if (item.key === 'AMMO_556') {
      newLoadout.rifleAmmoReserve += item.count;
    } else if (item.key === 'AMMO_45') {
      newLoadout.pistolAmmoReserve += item.count;
    } else if (slotNum === 1) {
      if (newLoadout.slot1) newStash.push(newLoadout.slot1);
      newLoadout.slot1 = item;
    } else if (slotNum === 2) {
      if (newLoadout.slot2) newStash.push(newLoadout.slot2);
      newLoadout.slot2 = item;
    } else if (slotNum === 3) {
      if (newLoadout.slot3) newStash.push(newLoadout.slot3);
      newLoadout.slot3 = item;
    } else if (slotNum === 4) {
      if (newLoadout.slot4) newStash.push(newLoadout.slot4);
      newLoadout.slot4 = item;
    } else if (slotNum === 5) {
      if (newLoadout.slot5) newStash.push(newLoadout.slot5);
      newLoadout.slot5 = item;
    } else {
      // Put into backpack
      newLoadout.backpack.push(item);
    }

    triggerUpdate(money, newLoadout, newStash);
  };

  // Unequip slot back to stash
  const unequipSlot = (slotNum: 1 | 2 | 3 | 4 | 5) => {
    if (mode === 'IN_GAME') return;

    const newLoadout = { ...loadout };
    const newStash = [...stash];
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
      newStash.push(removedItem);
      triggerUpdate(money, newLoadout, newStash);
    }
  };

  // Quick Action: Unequip ALL into Stash
  const handleQuickUnequipAll = () => {
    if (mode === 'IN_GAME') return;

    const newStash = [...stash];
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

    for (const b of loadout.backpack) {
      newStash.push(b);
    }

    const cleanLoadout: PlayerLoadout = {
      slot1: null,
      slot2: null,
      slot3: null,
      slot4: null,
      slot5: null,
      rifleAmmoReserve: 0,
      pistolAmmoReserve: 0,
      backpack: [],
    };

    sounds.playSwitchWeapon();
    triggerUpdate(money, cleanLoadout, newStash);
  };

  // Buy Item from Stash Marketplace
  const handleBuy = (catalogKey: 'M4A1' | 'PISTOL' | 'AMMO_556' | 'AMMO_45' | 'ICEWALL' | 'MEDKIT', cost: number) => {
    if (money < cost) {
      sounds.playBuyError();
      return;
    }
    sounds.playBuySuccess();
    const newItem = createStashItem(catalogKey);
    const newStash = [...stash, newItem];
    triggerUpdate(money - cost, loadout, newStash);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-6xl bg-[#0b0e0c] border-2 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header Bar matching WarZ Screenshot Navigation */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-black/90 border-b border-zinc-800">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black font-mono tracking-widest text-red-500 flex items-center gap-2">
              SURVIVORS <span className="text-white text-xs px-2 py-0.5 rounded bg-zinc-800 font-normal">WARZ LOADOUT</span>
            </h2>

            {mode === 'LOBBY' && (
              <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                <button
                  onClick={() => setIsStoreOpen(false)}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    !isStoreOpen ? 'bg-red-950 text-red-300 border border-red-700' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  LOADOUT &amp; STASH
                </button>
                <button
                  onClick={() => setIsStoreOpen(true)}
                  className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                    isStoreOpen ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>SUPPLY MARKETPLACE</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Cash Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-black text-emerald-400">
                ${money.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================= LEFT SIDE: EQUIPPED LOADOUT & BACKPACK ================= */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Section 1: EQUIPPED (Slot 1 & Slot 2) */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-red-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  EQUIPPED WEAPONRY
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {mode === 'IN_GAME' ? 'IN COMBAT' : 'DRAG OR CLICK TO UNEQUIP'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Slot 1: Primary Weapon */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 1)}
                  onClick={() => {
                    if (mode === 'IN_GAME' && loadout.slot1) onEquipInGameWeapon?.('RIFLE');
                    else unequipSlot(1);
                  }}
                  className={`h-28 rounded-xl border-2 flex flex-col justify-between p-3 transition-all cursor-pointer relative ${
                    loadout.slot1
                      ? 'bg-zinc-900/90 border-red-600/70 shadow-lg shadow-red-950/20'
                      : 'bg-zinc-900/30 border-dashed border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                      SLOT [1] PRIMARY
                    </span>
                    {loadout.slot1 && (
                      <span className="text-[10px] font-mono text-red-400 font-bold">{loadout.slot1.weight} KG</span>
                    )}
                  </div>

                  {loadout.slot1 ? (
                    <div>
                      <div className="text-sm font-black font-mono text-white truncate">
                        {loadout.slot1.name}
                      </div>
                      <div className="text-[11px] font-mono text-red-400">
                        RESERVE: {loadout.rifleAmmoReserve} RNDS
                      </div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-xs text-zinc-600 my-auto">
                      + EMPTY PRIMARY
                    </div>
                  )}
                </div>

                {/* Slot 2: Secondary Sidearm */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 2)}
                  onClick={() => {
                    if (mode === 'IN_GAME' && loadout.slot2) onEquipInGameWeapon?.('PISTOL');
                    else unequipSlot(2);
                  }}
                  className={`h-28 rounded-xl border-2 flex flex-col justify-between p-3 transition-all cursor-pointer relative ${
                    loadout.slot2
                      ? 'bg-zinc-900/90 border-amber-600/70 shadow-lg shadow-amber-950/20'
                      : 'bg-zinc-900/30 border-dashed border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                      SLOT [2] SIDEARM
                    </span>
                    {loadout.slot2 && (
                      <span className="text-[10px] font-mono text-amber-400 font-bold">{loadout.slot2.weight} KG</span>
                    )}
                  </div>

                  {loadout.slot2 ? (
                    <div>
                      <div className="text-sm font-black font-mono text-white truncate">
                        {loadout.slot2.name}
                      </div>
                      <div className="text-[11px] font-mono text-amber-400">
                        RESERVE: {loadout.pistolAmmoReserve} RNDS
                      </div>
                    </div>
                  ) : (
                    <div className="text-center font-mono text-xs text-zinc-600 my-auto">
                      + EMPTY SIDEARM
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: QUICKSLOTS (Slots 3, 4, 5) */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="border-b border-zinc-800 pb-2 flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-zinc-400 tracking-wider uppercase">
                  QUICKSLOTS [3, 4, 5]
                </span>
                <span className="text-[10px] font-mono text-zinc-500">HOTBAR ITEMS</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Slot 3: Utility (IceWall) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 3)}
                  onClick={() => unequipSlot(3)}
                  className={`h-24 rounded-xl border flex flex-col justify-between p-2.5 transition-all cursor-pointer ${
                    loadout.slot3
                      ? 'bg-cyan-950/40 border-cyan-500/60'
                      : 'bg-zinc-900/30 border-dashed border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[9px] font-mono text-cyan-400 font-bold">[3] UTILITY</span>
                  {loadout.slot3 ? (
                    <div>
                      <div className="text-xs font-bold font-mono text-cyan-200 truncate">{loadout.slot3.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">x{loadout.slot3.count}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-600 text-center my-auto">+ EMPTY</span>
                  )}
                </div>

                {/* Slot 4: Heal (Medkit) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 4)}
                  onClick={() => unequipSlot(4)}
                  className={`h-24 rounded-xl border flex flex-col justify-between p-2.5 transition-all cursor-pointer ${
                    loadout.slot4
                      ? 'bg-emerald-950/40 border-emerald-500/60'
                      : 'bg-zinc-900/30 border-dashed border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">[4] HEAL</span>
                  {loadout.slot4 ? (
                    <div>
                      <div className="text-xs font-bold font-mono text-emerald-200 truncate">{loadout.slot4.name}</div>
                      <div className="text-[10px] font-mono text-emerald-400">x{loadout.slot4.count}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-600 text-center my-auto">+ EMPTY</span>
                  )}
                </div>

                {/* Slot 5: Misc */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, 5)}
                  onClick={() => unequipSlot(5)}
                  className={`h-24 rounded-xl border flex flex-col justify-between p-2.5 transition-all cursor-pointer ${
                    loadout.slot5
                      ? 'bg-purple-950/40 border-purple-500/60'
                      : 'bg-zinc-900/30 border-dashed border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[9px] font-mono text-purple-400 font-bold">[5] MISC</span>
                  {loadout.slot5 ? (
                    <div>
                      <div className="text-xs font-bold font-mono text-purple-200 truncate">{loadout.slot5.name}</div>
                      <div className="text-[10px] font-mono text-purple-400">x{loadout.slot5.count}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-600 text-center my-auto">+ EMPTY</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: MILITARY RUCK / BACKPACK POCKETS */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  MILITARY RUCK BACKPACK
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  WEIGHT: <strong className={totalWeight > 50 ? 'text-red-400' : 'text-emerald-400'}>{totalWeight.toFixed(1)} KG</strong> / 60 KG
                </span>
              </div>

              {/* Reserve Ammo Badges in Pocket */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400 text-[11px]">5.56mm Ammo:</span>
                  <span className="font-bold text-red-400">{loadout.rifleAmmoReserve} Rnds</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400 text-[11px]">.45 ACP Ammo:</span>
                  <span className="font-bold text-amber-400">{loadout.pistolAmmoReserve} Rnds</span>
                </div>
              </div>

              {/* Quick Unequip All Button */}
              {mode === 'LOBBY' && (
                <button
                  onClick={handleQuickUnequipAll}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>QUICK UNEQUIP ALL TO STASH (เก็บของทั้งหมดเข้าคลัง)</span>
                </button>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: GLOBAL INVENTORY / STASH ================= */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {mode === 'IN_GAME' ? (
              // In-Game Mode: Stash is locked in safe outpost
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 my-auto h-full">
                <Shield className="w-12 h-12 text-zinc-600" />
                <div>
                  <h3 className="text-base font-bold font-mono text-zinc-200">
                    IN-RAID TACTICAL INVENTORY
                  </h3>
                  <p className="text-xs font-mono text-zinc-500 max-w-md mt-1">
                    Global Stash &amp; Marketplace are inaccessible during a combat deployment. Survive and reach the Green Extraction Zone to return safely with your gear!
                  </p>
                </div>
              </div>
            ) : isStoreOpen ? (
              // Marketplace Store
              <div className="bg-zinc-950/90 border border-amber-600/40 rounded-xl p-4 flex flex-col justify-between h-full space-y-4">
                <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      SUPPLY MARKETPLACE // BUY INTO STASH
                    </span>
                  </div>
                  <button
                    onClick={() => setIsStoreOpen(false)}
                    className="text-xs font-mono text-amber-400 underline font-bold cursor-pointer"
                  >
                    BACK TO STASH
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[58vh]">
                  {CATALOG_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold uppercase">
                            {item.category}
                          </span>
                          <span className="text-sm font-mono font-black text-emerald-400">${item.cost.toLocaleString()}</span>
                        </div>
                        <h4 className="text-sm font-bold font-mono text-white">{item.name}</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">{item.description}</p>
                      </div>

                      <button
                        onClick={() => handleBuy(item.key, item.cost)}
                        disabled={money < item.cost}
                        className={`w-full mt-3 py-2 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          money >= item.cost
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        PURCHASE (${item.cost.toLocaleString()})
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Global Inventory Stash Grid
              <div
                onDragOver={handleDragOver}
                onDrop={handleDropOnStash}
                className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-col h-full space-y-4"
              >
                {/* Category Filter Tabs matching WarZ screenshot */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {(['ALL', 'WEAPONS', 'AMMO', 'MEDICAL', 'UTILITY'] as ItemCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          activeTab === cat
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] font-mono text-zinc-500">
                    ITEMS: <strong className="text-zinc-200">{stash.length}</strong>
                  </span>
                </div>

                {/* Stash Grid Cells */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 overflow-y-auto max-h-[58vh] p-1">
                  {filteredStash.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'STASH', item)}
                      onClick={() => equipItemToSlot(item)}
                      className="aspect-square rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-red-500/80 p-2 flex flex-col justify-between transition-all cursor-pointer relative group shadow-md"
                      title={`${item.name}\n${item.description}\nClick to equip`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold uppercase">
                          {item.key.includes('AMMO') ? 'AMMO' : item.key}
                        </span>
                        {item.count > 1 && (
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            x{item.count}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-bold font-mono text-white leading-tight truncate">
                        {item.name}
                      </div>

                      <div className="text-[9px] font-mono text-zinc-500 flex justify-between">
                        <span>{item.weight}kg</span>
                        <span className="text-emerald-400 group-hover:block hidden">EQUIP &rarr;</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty Fillers */}
                  {Array.from({ length: Math.max(0, 20 - filteredStash.length) }).map((_, idx) => (
                    <div
                      key={`empty_${idx}`}
                      className="aspect-square rounded-xl bg-zinc-900/20 border border-dashed border-zinc-850 flex items-center justify-center font-mono text-xs text-zinc-800"
                    >
                      &bull;
                    </div>
                  ))}
                </div>

                {/* Stash Bottom Tip */}
                <div className="pt-2 border-t border-zinc-900 text-[11px] font-mono text-zinc-500 flex justify-between items-center">
                  <span>Double-click or drag item into Slot 1-5 to equip</span>
                  <button
                    onClick={() => setIsStoreOpen(true)}
                    className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    + BUY MORE ITEMS
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
