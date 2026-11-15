from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
app = FastAPI(title='DOMANDO RUSH - COLOR STORM', version='3.0')
app.mount('/static', StaticFiles(directory=ROOT / 'static'), name='static')

@app.get('/')
def home():
    return FileResponse(ROOT / 'static' / 'index.html')

@app.get('/health')
def health():
    return {'ok': True, 'game': 'DOMANDO RUSH', 'version': '3.0', 'mode': 'single-player'}
