# DOMANDO RUSH Ver.4.0 — FOUR ROADS

**4 genres in one original game.** Python/FastAPI serves one browser game; no account, third-party assets, multiplayer, microtransactions or ads. PC / phone, local progress.

## Adventure hub

A colorful RPG town you actually walk around. Choose one of four gateways, and visit the forge to buy persistent, optional character upgrades with coins earned by playing. Coins and records are stored in the current browser only. Version 3 coin balance is imported **once** when Version 4 is first opened on that browser (Version 3 data is left untouched).

## Four playable games

1. **そよかぜの森 — Prism Grove**: 95-second survival arena with automatic magic projectiles, chasing creatures, upgrades while playing, HP, dash and rainbow storm.
2. **空跳びの塔 — Cloud Hop**: horizontal platforming course with gaps, floating platforms, collectibles, enemy collisions, checkpoints, sprint/dash and a goal.
3. **月影の神殿 — Moon Temple**: three-stage turn-based RPG with four commands, focus points, telegraphed stronger enemy turns, healing, guarding and persistent HP.
4. **虹の研究所 — Prism Lab**: six designed beam-routing puzzles; rotate pipes so the source connects to both gems and the end target. Undo, hints and staged challenges.

The game mechanics, visual characters, code and names are original. General inspiration: classic JRPG exploration, side-scrolling platform games, wave-survival games and spatial logic puzzles. No third-party artwork or audio is embedded.

## Windows local play

In PowerShell inside the folder containing `main.py`:

```powershell
py -m pip install -r requirements.txt
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Then open `http://127.0.0.1:8000/`. To stop: `Ctrl+C`.

## Browser controls

- Town: WASD or arrow keys, E / Enter to enter nearby gates. Click/tap a building to enter directly.
- Survival: WASD/arrow keys, automatic shots, Shift dash, Space or F rainbow storm; pick level-ups by clicking or 1/2/3.
- Platforming: arrows/A/D move, Space/Up jump, Shift dash. Touch A/B supports mobile.
- RPG: click a command or press 1–4, Enter for next encounter.
- Puzzle: tap pipe tiles to rotate; Z undo, H hint, Enter proceed after solving.
- Escape pauses and opens a resume/return option. Audio can be toggled in town.

## Existing GitHub + Render deployment

Keep the same repository `ryota321ryota-lang/domando-rush` and Render service `domando-rush`; **do not create a second service**.

1. Unzip Ver.4.0 and open the folder with `main.py`.
2. Open `https://github.com/ryota321ryota-lang/domando-rush/upload` and drag the **contents** (including the `static` folder) to GitHub. Confirm overwrite/replace the old files, and click Commit changes.
3. Render is configured to automatically deploy commits from the `main` branch.
4. When status is Live, open `https://domando-rush.onrender.com`, force refresh (Ctrl+F5) if you see an old version.

Build command: `pip install -r requirements.txt`
Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Note:** Free Render services may spin down after inactivity. There is no public leaderboard because the game is single-player, with local saves.
