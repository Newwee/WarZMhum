import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Room, RoomMember, PlayerNetState, ZombieNetState, ShootEvent, WaveState, MatchSummary, IceWallObject, KillFeedItem, GroundLootCrate } from '@/types/game';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface NetworkCallbacks {
  onMembersChange?: (members: RoomMember[]) => void;
  onRoomStatusChange?: (status: Room['status']) => void;
  onRemotePlayerUpdate?: (player: PlayerNetState) => void;
  onRemotePlayerShoot?: (event: ShootEvent) => void;
  onZombieSync?: (zombies: ZombieNetState[]) => void;
  onZombieDamaged?: (data: { zombieId: string; damage: number; attackerId: string }) => void;
  onPlayerDamaged?: (data: { playerId: string; damage: number; attackerName?: string; weapon?: string; isHeadshot?: boolean }) => void;
  onWaveChange?: (wave: WaveState) => void;
  onGameOver?: (summary: MatchSummary) => void;
  onIceWallSpawn?: (wall: IceWallObject) => void;
  onIceWallDamage?: (data: { id: string; damage: number }) => void;
  onKillFeed?: (item: KillFeedItem) => void;
  onLootDrop?: (crate: GroundLootCrate) => void;
  onLootTaken?: (data: { crateId: string; looterId: string }) => void;
}

export class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private localBroadcast: BroadcastChannel | null = null;
  private roomCode: string = '';
  private currentUserId: string = '';
  private callbacks: NetworkCallbacks = {};
  private isHost: boolean = false;
  private lastPositionSendTime: number = 0;
  private readonly POSITION_SEND_INTERVAL = 100; // 10 Hz (every 100ms)

  constructor(roomCode: string, currentUserId: string, isHost: boolean, callbacks: NetworkCallbacks) {
    this.roomCode = roomCode.toUpperCase();
    this.currentUserId = currentUserId;
    this.isHost = isHost;
    this.callbacks = callbacks;
  }

  public async connect(userDisplayName: string): Promise<boolean> {
    const supabase = getSupabase();

    if (isSupabaseConfigured && supabase) {
      // Connect using Supabase Realtime
      const channelName = `warz_room_${this.roomCode}`;
      this.channel = supabase.channel(channelName, {
        config: {
          presence: { key: this.currentUserId },
          broadcast: { self: false },
        },
      });

      // Listen for presence state (players in room)
      this.channel.on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState() || {};
        const members: RoomMember[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          const latest = presences[presences.length - 1] as any;
          if (latest) {
            members.push({
              id: key,
              room_id: this.roomCode,
              profile_id: key,
              role: latest.role || (key === this.currentUserId && this.isHost ? 'HOST' : 'PLAYER'),
              is_ready: Boolean(latest.is_ready),
              display_name: latest.name || 'Survivor',
              joined_at: latest.joined_at || new Date().toISOString(),
            });
          }
        });

        this.callbacks.onMembersChange?.(members);
      });

      // Listen for broadcasts
      this.channel
        .on('broadcast', { event: 'room_status' }, ({ payload }) => {
          this.callbacks.onRoomStatusChange?.(payload.status);
        })
        .on('broadcast', { event: 'player_pos' }, ({ payload }) => {
          if (payload.id !== this.currentUserId) {
            this.callbacks.onRemotePlayerUpdate?.(payload);
          }
        })
        .on('broadcast', { event: 'player_shoot' }, ({ payload }) => {
          if (payload.shooterId !== this.currentUserId) {
            this.callbacks.onRemotePlayerShoot?.(payload);
          }
        })
        .on('broadcast', { event: 'zombie_sync' }, ({ payload }) => {
          this.callbacks.onZombieSync?.(payload.zombies);
        })
        .on('broadcast', { event: 'zombie_damage' }, ({ payload }) => {
          this.callbacks.onZombieDamaged?.(payload);
        })
        .on('broadcast', { event: 'player_damage' }, ({ payload }) => {
          this.callbacks.onPlayerDamaged?.(payload);
        })
        .on('broadcast', { event: 'wave_state' }, ({ payload }) => {
          this.callbacks.onWaveChange?.(payload);
        })
        .on('broadcast', { event: 'game_over' }, ({ payload }) => {
          this.callbacks.onGameOver?.(payload);
        })
        .on('broadcast', { event: 'icewall_spawn' }, ({ payload }) => {
          this.callbacks.onIceWallSpawn?.(payload);
        })
        .on('broadcast', { event: 'icewall_damage' }, ({ payload }) => {
          this.callbacks.onIceWallDamage?.(payload);
        })
        .on('broadcast', { event: 'kill_feed' }, ({ payload }) => {
          this.callbacks.onKillFeed?.(payload);
        })
        .on('broadcast', { event: 'loot_drop' }, ({ payload }) => {
          this.callbacks.onLootDrop?.(payload);
        })
        .on('broadcast', { event: 'loot_taken' }, ({ payload }) => {
          this.callbacks.onLootTaken?.(payload);
        });

      // Subscribe and track presence
      await new Promise<void>((resolve) => {
        this.channel?.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.channel?.track({
              userId: this.currentUserId,
              name: userDisplayName,
              role: this.isHost ? 'HOST' : 'PLAYER',
              is_ready: this.isHost ? true : false,
              joined_at: new Date().toISOString(),
            });
            resolve();
          }
        });
      });

      return true;
    } else {
      // Offline / Local Multi-tab Fallback using browser BroadcastChannel
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.localBroadcast = new BroadcastChannel(`warz_local_${this.roomCode}`);
        this.localBroadcast.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'room_status') this.callbacks.onRoomStatusChange?.(payload.status);
          if (type === 'player_pos' && payload.id !== this.currentUserId) this.callbacks.onRemotePlayerUpdate?.(payload);
          if (type === 'player_shoot' && payload.shooterId !== this.currentUserId) this.callbacks.onRemotePlayerShoot?.(payload);
          if (type === 'zombie_sync') this.callbacks.onZombieSync?.(payload.zombies);
          if (type === 'zombie_damage') this.callbacks.onZombieDamaged?.(payload);
          if (type === 'player_damage') this.callbacks.onPlayerDamaged?.(payload);
          if (type === 'wave_state') this.callbacks.onWaveChange?.(payload);
          if (type === 'game_over') this.callbacks.onGameOver?.(payload);
          if (type === 'icewall_spawn') this.callbacks.onIceWallSpawn?.(payload);
          if (type === 'icewall_damage') this.callbacks.onIceWallDamage?.(payload);
          if (type === 'kill_feed') this.callbacks.onKillFeed?.(payload);
          if (type === 'loot_drop') this.callbacks.onLootDrop?.(payload);
          if (type === 'loot_taken') this.callbacks.onLootTaken?.(payload);
        };
      }
      return true;
    }
  }

  public sendPosition(state: PlayerNetState) {
    const now = performance.now();
    if (now - this.lastPositionSendTime < this.POSITION_SEND_INTERVAL) {
      return;
    }
    this.lastPositionSendTime = now;

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'player_pos',
        payload: state,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'player_pos',
        payload: state,
      });
    }
  }

  public sendShoot(event: ShootEvent) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'player_shoot',
        payload: event,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'player_shoot',
        payload: event,
      });
    }
  }

  public sendZombieSync(zombies: ZombieNetState[]) {
    if (!this.isHost) return; // Only host sends authoritative zombie coordinates
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'zombie_sync',
        payload: { zombies },
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'zombie_sync',
        payload: { zombies },
      });
    }
  }

  public sendZombieDamaged(zombieId: string, damage: number, attackerId: string) {
    const payload = { zombieId, damage, attackerId };
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'zombie_damage',
        payload,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'zombie_damage',
        payload,
      });
    }
  }

  public sendPlayerDamaged(playerId: string, damage: number, attackerName?: string, weapon?: string, isHeadshot?: boolean) {
    const payload = { playerId, damage, attackerName, weapon, isHeadshot };
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'player_damage',
        payload,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'player_damage',
        payload,
      });
    }
  }

  public sendKillFeed(item: KillFeedItem) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'kill_feed',
        payload: item,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'kill_feed',
        payload: item,
      });
    }
  }

  public sendWaveState(wave: WaveState) {
    if (!this.isHost) return;
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'wave_state',
        payload: wave,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'wave_state',
        payload: wave,
      });
    }
  }

  public sendStartGame() {
    if (!this.isHost) return;
    const payload = { status: 'IN_PROGRESS' as const };
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'room_status',
        payload,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'room_status',
        payload,
      });
    }
    this.callbacks.onRoomStatusChange?.('IN_PROGRESS');
  }

  public sendGameOver(summary: MatchSummary) {
    if (!this.isHost) return;
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'game_over',
        payload: summary,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'game_over',
        payload: summary,
      });
    }
  }

  public sendIceWallSpawn(wall: IceWallObject) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'icewall_spawn',
        payload: wall,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'icewall_spawn',
        payload: wall,
      });
    }
  }

  public sendIceWallDamage(wallId: string, damage: number) {
    const payload = { id: wallId, damage };
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'icewall_damage',
        payload,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'icewall_damage',
        payload,
      });
    }
  }

  public sendLootDrop(crate: GroundLootCrate) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'loot_drop',
        payload: crate,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'loot_drop',
        payload: crate,
      });
    }
  }

  public sendLootTaken(crateId: string, looterId: string) {
    const payload = { crateId, looterId };
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'loot_taken',
        payload,
      });
    } else if (this.localBroadcast) {
      this.localBroadcast.postMessage({
        type: 'loot_taken',
        payload,
      });
    }
  }

  public async updateReadyStatus(isReady: boolean, userDisplayName: string) {
    if (this.channel) {
      await this.channel.track({
        userId: this.currentUserId,
        name: userDisplayName,
        role: this.isHost ? 'HOST' : 'PLAYER',
        is_ready: isReady,
        joined_at: new Date().toISOString(),
      });
    }
  }

  public disconnect() {
    if (this.channel) {
      const supabase = getSupabase();
      if (supabase) {
        supabase.removeChannel(this.channel);
      }
      this.channel = null;
    }
    if (this.localBroadcast) {
      this.localBroadcast.close();
      this.localBroadcast = null;
    }
  }
}
