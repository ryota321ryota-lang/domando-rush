"""DOMANDO RUSH 5.0 LUMINOUS ATLAS - original single-player world adventure."""
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
app = FastAPI(title="DOMANDO RUSH - LUMINOUS ATLAS", version="5.0.0")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


@app.get("/")
def home():
    return FileResponse(ROOT / "static" / "index.html", headers={"Cache-Control": "no-cache, max-age=0"})


@app.get("/health")
def health():
    return JSONResponse({"ok": True, "game": "DOMANDO RUSH", "version": "5.0.0", "mode": "single-player", "world": "LUMINOUS ATLAS"})


@app.get("/sw.js", include_in_schema=False)
def service_worker():
    return FileResponse(ROOT / "static" / "sw.js", media_type="text/javascript", headers={"Service-Worker-Allowed": "/", "Cache-Control": "no-cache"})
