'use client';

import React from 'react';
import { PlayerInventory } from '@/types/game';
import { sounds } from '@/lib/audio/sound-effects';
import { Crosshair, Shield, PlusCircle, ShoppingBag, X, Check, DollarSign } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PlayerInventory;
  onBuyItem: (itemKey: 'RIFLE' | 'RIFLE_AMMO' | 'PISTOL' | 'PISTOL_AMMO' | 'ICEWALL' | 'MEDKIT', cost: number) => void;
}

export function ShopModal({ isOpen, onClose, inventory, onBuyItem }: ShopModalProps) {
  if (!isOpen) return null;

  const handleBuy = (itemKey: 'RIFLE' | 'RIFLE_AMMO' | 'PISTOL' | 'PISTOL_AMMO' | 'ICEWALL' | 'MEDKIT', cost: number) => {
    if (inventory.money < cost) {
      sounds.playBuyError();
      return;
    }
    sounds.playBuySuccess();
    onBuyItem(itemKey, cost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950/95 border-2 border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/80 border border-red-700/60 rounded-lg text-red-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider text-white font-mono uppercase">
                SURVIVOR SUPPLY CACHE // ARMORY
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Press [B] or [ESC] to exit armory & lock weapons
              </p>
            </div>
          </div>

          {/* Player Funds & Close Button */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl shadow-inner">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase">Available Cash</span>
                <span className="text-xl font-mono font-black text-emerald-400 tracking-wide">
                  ${inventory.money.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Section 1: Primary & Secondary Weapons */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase mb-3 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-red-500" />
              Ballistic Weaponry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* M4A1 Assault Rifle */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900 font-bold uppercase">
                        Slot [1] Primary
                      </span>
                      <h4 className="text-base font-bold font-mono text-white mt-1">M4A1 Assault Rifle</h4>
                    </div>
                    <span className="text-base font-mono font-black text-emerald-400">$2,500</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Full-auto 5.56mm carbine. 30-round mag, 85 DMG headshot, crisp iron sights with [Right Click] ADS.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-zinc-800/60">
                  {inventory.hasRifle ? (
                    <button
                      onClick={() => handleBuy('RIFLE_AMMO', 200)}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      BUY 30 ROUNDS AMMO ($200)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy('RIFLE', 2500)}
                      disabled={inventory.money < 2500}
                      className={`w-full py-2.5 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        inventory.money >= 2500
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      PURCHASE M4A1 ($2,500)
                    </button>
                  )}
                </div>
              </div>

              {/* .45 Thunder Revolver */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold uppercase">
                        Slot [2] Sidearm
                      </span>
                      <h4 className="text-base font-bold font-mono text-white mt-1">.45 Thunder Revolver</h4>
                    </div>
                    <span className="text-base font-mono font-black text-emerald-400">$1,000</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Heavy .45 caliber sidearm. 6-round cylinder, 120 DMG headshot punch that tears through Walker heads.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-zinc-800/60">
                  {inventory.hasPistol ? (
                    <button
                      onClick={() => handleBuy('PISTOL_AMMO', 100)}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      BUY 12 ROUNDS AMMO ($100)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy('PISTOL', 1000)}
                      disabled={inventory.money < 1000}
                      className={`w-full py-2.5 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        inventory.money >= 1000
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      PURCHASE .45 PISTOL ($1,000)
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Tactical Defense & Medical Consumables */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Tactical & Medical Deployables
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* IceWall Deployer */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-cyan-700/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                        Slot [3] Tactical
                      </span>
                      <h4 className="text-base font-bold font-mono text-cyan-200 mt-1 flex items-center gap-2">
                        IceWall Deployer
                        <span className="text-xs px-2 py-0.5 bg-cyan-900/80 text-cyan-300 rounded-full font-mono font-normal">
                          In Pack: {inventory.iceWalls}
                        </span>
                      </h4>
                    </div>
                    <span className="text-base font-mono font-black text-emerald-400">$800</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Press [3] to project a placement hologram. Left-click to deploy an impenetrable 400 HP ice barricade that blocks all bullets and stops zombie swarms!
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/60">
                  <button
                    onClick={() => handleBuy('ICEWALL', 800)}
                    disabled={inventory.money < 800}
                    className={`w-full py-2.5 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      inventory.money >= 800
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    PURCHASE ICEWALL ($800)
                  </button>
                </div>
              </div>

              {/* Military Medkit */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-emerald-700/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                        Slot [4] Consumable
                      </span>
                      <h4 className="text-base font-bold font-mono text-emerald-200 mt-1 flex items-center gap-2">
                        Military Medkit
                        <span className="text-xs px-2 py-0.5 bg-emerald-900/80 text-emerald-300 rounded-full font-mono font-normal">
                          In Pack: {inventory.medkits}
                        </span>
                      </h4>
                    </div>
                    <span className="text-base font-mono font-black text-emerald-400">$500</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                    Surgical combat stimulants. Press [4] or hotbar slot to instantly inject and recover +50 HP when wounded by zombie attacks or player gunfire.
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/60">
                  <button
                    onClick={() => handleBuy('MEDKIT', 500)}
                    disabled={inventory.money < 500}
                    className={`w-full py-2.5 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      inventory.money >= 500
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    PURCHASE MEDKIT ($500)
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Kill zombies to earn extra bounty cash: Walker ($150) | Runner ($250) | Tank ($600)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
          >
            RESUME COMBAT [ESC]
          </button>
        </div>

      </div>
    </div>
  );
}
