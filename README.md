# WARZ SURVIVAL MULTIPLAYER (Web Browser MVP)

A high-performance, browser-based 3D multiplayer zombie survival defense game built with **Next.js 14**, **Three.js**, **React Three Fiber (R3F)**, and **Supabase Realtime**.

Deploys seamlessly to **Vercel**.

---

## 🎮 Gameplay Features

- **First-Person Shooter (FPS) View**: Full 3D camera controls with PointerLock, mouse look, jump, crouch, sprint, and head-bobbing.
- **Assault Rifle Combat**: Raycast shooting with dynamic muzzle flashes, weapon recoil, hit detection, headshot multipliers, and sound effects.
- **Wave-Based Zombie Survival**:
  - `WALKER`: Standard zombies (balanced speed and health).
  - `RUNNER`: Fast charging infected (quick sprint, lower health).
  - `TANK`: Heavy mutant zombies (high health and crushing attack).
- **Host-Authoritative Multiplayer**:
  - Squad lobby with room codes and 1-click invite links.
  - Ready/Not-ready indicators.
  - Low-latency position sync (10 Hz with linear interpolation / lerp for smooth teammate movement).
  - Authoritative zombie simulation and wave progression handled by Host.
  - Procedural Web Audio sound synthesizer (zero external audio file dependencies).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional for Live Supabase)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase URL and Anon/Publishable Key:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vgfpvhdssbfsipashupj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_publishable_key
```
*(Note: If keys are omitted, the game automatically runs in local multi-tab sync mode via browser `BroadcastChannel` for instant local testing!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Multiplayer with 2 Browsers

1. Open `http://localhost:3000` in Window 1.
2. Enter your name and click **CREATE OUTPOST ROOM (HOST)**.
3. Copy the Room Code (e.g. `WZ-84A`).
4. Open `http://localhost:3000` in Window 2 (or Incognito).
5. Enter a different name, paste the Room Code, and click **JOIN**.
6. In Window 2, click **READY FOR DEPLOYMENT**.
7. In Window 1, as Host, click **START SQUAD MISSION**.
8. Both players will deploy into the 3D game arena simultaneously!

---

## 🗄️ Database Setup (Supabase)

To enable persistent profiles, game rooms, and match leaderboards:
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/vgfpvhdssbfsipashupj](https://supabase.com/dashboard/project/vgfpvhdssbfsipashupj)
2. Go to the **SQL Editor**.
3. Run the SQL script located at `src/sql/01_initial_schema.sql`.

---

## 📦 Deployment to Vercel

1. Push this repository to GitHub: `https://github.com/Newwee/WarZMhum`.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Click **Deploy**.
