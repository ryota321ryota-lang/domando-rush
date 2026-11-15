from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
app = FastAPI(title="DOMANDO RUSH — Adventure")
ROOT = Path(__file__).resolve().parent
@app.get('/')
def index():
    return FileResponse(ROOT/'static'/'index.html')
@app.get('/health')
def health():
    return {'ok':True,'game':'DOMANDO RUSH','version':'2.0','mode':'single-player'}
