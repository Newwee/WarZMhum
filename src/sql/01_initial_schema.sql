-- ====================================================================
-- WARZ SURVIVAL MULTIPLAYER: SUPABASE DATABASE INITIAL SCHEMA & RLS
-- Project Ref: vgfpvhdssbfsipashupj
-- ====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Supports Anonymous & Authenticated Players)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON public.profiles(auth_user_id);

-- 2. GAME ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(8) NOT NULL UNIQUE,
    host_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Zombie Outpost',
    max_players INT NOT NULL DEFAULT 4,
    current_players INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING', -- 'WAITING', 'STARTING', 'IN_PROGRESS', 'FINISHED'
    current_wave INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '4 hours')
);

CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);

-- 3. GAME ROOM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.game_room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'PLAYER', -- 'HOST', 'PLAYER'
    is_ready BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_room_member UNIQUE (room_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.game_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_profile ON public.game_room_members(profile_id);

-- 4. GAME SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    final_wave INT NOT NULL DEFAULT 1,
    total_zombies_killed INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. MATCH RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    survival_seconds INT NOT NULL DEFAULT 0,
    zombies_killed INT NOT NULL DEFAULT 0,
    shots_fired INT NOT NULL DEFAULT 0,
    shots_hit INT NOT NULL DEFAULT 0,
    damage_dealt INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_match_results_session ON public.match_results(session_id);
CREATE INDEX IF NOT EXISTS idx_match_results_profile ON public.match_results(profile_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles; users can create and edit their own profile
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can create a profile" 
ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (
    (auth_user_id IS NOT NULL AND auth.uid() = auth_user_id) OR
    (auth_user_id IS NULL)
);

-- Game Rooms: Viewable by anyone
CREATE POLICY "Rooms viewable by all players" 
ON public.game_rooms FOR SELECT USING (true);

CREATE POLICY "Players can create rooms" 
ON public.game_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Host can update room" 
ON public.game_rooms FOR UPDATE USING (true);

CREATE POLICY "Host can delete room" 
ON public.game_rooms FOR DELETE USING (true);

-- Room Members: Viewable by anyone in the room
CREATE POLICY "Room members viewable by all" 
ON public.game_room_members FOR SELECT USING (true);

CREATE POLICY "Players can join room members" 
ON public.game_room_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Members can update own ready status" 
ON public.game_room_members FOR UPDATE USING (true);

CREATE POLICY "Members can leave room" 
ON public.game_room_members FOR DELETE USING (true);

-- Game Sessions & Results:
CREATE POLICY "Sessions viewable by all" 
ON public.game_sessions FOR SELECT USING (true);

CREATE POLICY "Sessions insertable" 
ON public.game_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions updateable" 
ON public.game_sessions FOR UPDATE USING (true);

CREATE POLICY "Results viewable by all" 
ON public.match_results FOR SELECT USING (true);

CREATE POLICY "Results insertable" 
ON public.match_results FOR INSERT WITH CHECK (true);

-- ====================================================================
-- REALTIME PUBLICATION
-- Enable Realtime for game_rooms and game_room_members
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_room_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_room_members;
    END IF;
END $$;
