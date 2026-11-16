"""DOMANDO RUSH: Four Roads - offline-first solo browser game, deployed with Render."""
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
app = FastAPI(title='DOMANDO RUSH - Four Roads', version='4.0.0')
app.mount('/static', StaticFiles(directory=ROOT / 'static'), name='static')

@app.get('/')
def home():
    return FileResponse(ROOT / 'static' / 'index.html', headers={'Cache-Control': 'no-cache, max-age=0'})

@app.get('/health')
def health():
    return JSONResponse({'ok': True, 'game': 'DOMANDO RUSH', 'version': '4.0.0', 'mode': 'single-player'})
