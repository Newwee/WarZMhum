'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MainMenu } from '@/components/lobby/MainMenu';
import { RoomLobby } from '@/components/lobby/RoomLobby';
import { GameCanvas } from '@/components/game/GameCanvas';
import { RealtimeManager } from '@/lib/network/realtime-manager';
import { RoomMember, PlayerInventory } from '@/types/game';

export default function HomePage() {
  const [view, setView] = useState<'MENU' | 'LOBBY' | 'GAME'>('MENU');
  const [roomCode, setRoomCode] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [localPlayerName, setLocalPlayerName] = useState('Survivor');
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);

  // Persistent Survivor Loadout & Funds (Starts with $10,000 cash and unarmed)
  const [inventory, setInventory] = useState<PlayerInventory>({
    money: 10000,
    hasRifle: false,
    rifleAmmo: 0,
    hasPistol: false,
    pistolAmmo: 0,
    iceWalls: 0,
    medkits: 0,
  });

  const realtimeManagerRef = useRef<RealtimeManager | null>(null);

  // Initialize unique session ID
  useEffect(() => {
    let sid = sessionStorage.getItem('warz_session_id');
    if (!sid) {
      sid = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('warz_session_id', sid);
    }
    setLocalPlayerId(sid);

    // Auto-fill room code from URL query parameter (e.g. ?room=WZ-84A)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
    }
  }, []);

  // Cleanup network on unmount
  useEffect(() => {
    return () => {
      realtimeManagerRef.current?.disconnect();
    };
  }, []);

  // Armory Item Purchase (in Lobby or Staging Area)
  const handleBuyItem = (
    itemKey: 'RIFLE' | 'RIFLE_AMMO' | 'PISTOL' | 'PISTOL_AMMO' | 'ICEWALL' | 'MEDKIT',
    cost: number
  ) => {
    setInventory((prev) => {
      if (prev.money < cost) return prev;
      const next = { ...prev, money: prev.money - cost };
      if (itemKey === 'RIFLE') {
        next.hasRifle = true;
        next.rifleAmmo = prev.rifleAmmo + 60;
      } else if (itemKey === 'RIFLE_AMMO') {
        next.rifleAmmo = prev.rifleAmmo + 30;
      } else if (itemKey === 'PISTOL') {
        next.hasPistol = true;
        next.pistolAmmo = prev.pistolAmmo + 18;
      } else if (itemKey === 'PISTOL_AMMO') {
        next.pistolAmmo = prev.pistolAmmo + 12;
      } else if (itemKey === 'ICEWALL') {
        next.iceWalls = prev.iceWalls + 1;
      } else if (itemKey === 'MEDKIT') {
        next.medkits = prev.medkits + 1;
      }
      return next;
    });
  };

  // 1. PLAY NOW (Instant entry into Public Shared Warzone WARZ-GLOBAL)
  const handlePlayPublic = async (name: string) => {
    setLocalPlayerName(name);
    const code = 'WARZ-GLOBAL';
    setRoomCode(code);
    setIsHost(true);

    const initialMember: RoomMember = {
      id: localPlayerId,
      room_id: code,
      profile_id: localPlayerId,
      role: 'HOST',
      is_ready: true,
      display_name: name,
      joined_at: new Date().toISOString(),
    };
    setMembers([initialMember]);

    const mgr = new RealtimeManager(code, localPlayerId, true, {
      onMembersChange: (mList) => {
        if (mList.length > 0) setMembers(mList);
      },
    });

    await mgr.connect(name);
    realtimeManagerRef.current = mgr;
    setView('GAME');
  };

  // 2. Create Private Room (Squad Outpost)
  const handleCreateRoom = async (name: string) => {
    setLocalPlayerName(name);
    const code = 'WZ-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(code);
    setIsHost(true);

    const initialMember: RoomMember = {
      id: localPlayerId,
      room_id: code,
      profile_id: localPlayerId,
      role: 'HOST',
      is_ready: true,
      display_name: name,
      joined_at: new Date().toISOString(),
    };
    setMembers([initialMember]);

    const mgr = new RealtimeManager(code, localPlayerId, true, {
      onMembersChange: (mList) => {
        if (mList.length > 0) setMembers(mList);
      },
      onRoomStatusChange: (status) => {
        if (status === 'IN_PROGRESS') {
          setView('GAME');
        }
      },
    });

    await mgr.connect(name);
    realtimeManagerRef.current = mgr;
    setView('LOBBY');
  };

  // 3. Join Private Room with code
  const handleJoinRoom = async (code: string, name: string) => {
    setLocalPlayerName(name);
    setRoomCode(code);
    setIsHost(false);

    const initialMember: RoomMember = {
      id: localPlayerId,
      room_id: code,
      profile_id: localPlayerId,
      role: 'PLAYER',
      is_ready: false,
      display_name: name,
      joined_at: new Date().toISOString(),
    };
    setMembers([initialMember]);

    const mgr = new RealtimeManager(code, localPlayerId, false, {
      onMembersChange: (mList) => {
        if (mList.length > 0) setMembers(mList);
      },
      onRoomStatusChange: (status) => {
        if (status === 'IN_PROGRESS') {
          setView('GAME');
        }
      },
    });

    await mgr.connect(name);
    realtimeManagerRef.current = mgr;
    setView('LOBBY');
  };

  const handleToggleReady = (ready: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m.profile_id === localPlayerId ? { ...m, is_ready: ready } : m))
    );
    realtimeManagerRef.current?.updateReadyStatus(ready, localPlayerName);
  };

  const handleStartGame = () => {
    if (!isHost) return;
    realtimeManagerRef.current?.sendStartGame();
    setView('GAME');
  };

  const handleLeaveRoom = () => {
    realtimeManagerRef.current?.disconnect();
    realtimeManagerRef.current = null;
    setView('MENU');
    setRoomCode('');
    setMembers([]);
    setIsHost(false);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      {view === 'MENU' && (
        <MainMenu
          onPlayPublic={handlePlayPublic}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          inventory={inventory}
          onBuyItem={handleBuyItem}
        />
      )}

      {view === 'LOBBY' && (
        <RoomLobby
          roomCode={roomCode}
          members={members}
          currentUserId={localPlayerId}
          isHost={isHost}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          inventory={inventory}
          onBuyItem={handleBuyItem}
        />
      )}

      {view === 'GAME' && (
        <GameCanvas
          roomCode={roomCode}
          localPlayerId={localPlayerId}
          localPlayerName={localPlayerName}
          isHost={isHost}
          realtimeManager={realtimeManagerRef.current}
          onExitGame={handleLeaveRoom}
          initialInventory={inventory}
          onInventoryChange={setInventory}
        />
      )}
    </div>
  );
}
