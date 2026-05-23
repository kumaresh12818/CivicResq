from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
import os

app = FastAPI(
    title="CivicResQ AI Emergency Response API",
    description="Real-time crisis management intelligence system",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routing
app.include_router(api_router, prefix="/api/v1")

# Dummy websocket endpoint for live dashboard
connected_clients = set()

@app.websocket("/api/v1/ws/dispatch")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming signals if necessary
    except Exception as e:
        connected_clients.remove(websocket)

async def broadcast_alert(message: str):
    for client in connected_clients:
        try:
            await client.send_text(message)
        except:
            pass

# Serve Next.js compiled frontend globally across missing routes
# Resolve path: backend/app/main.py -> backend/app -> backend -> repo_root -> frontend/out
_BACKEND_APP_DIR = os.path.dirname(os.path.abspath(__file__))  # .../backend/app
_BACKEND_DIR = os.path.dirname(_BACKEND_APP_DIR)               # .../backend
_REPO_ROOT = os.path.dirname(_BACKEND_DIR)                      # .../repo_root
FRONTEND_BUILD_DIR = os.path.join(_REPO_ROOT, "frontend", "out")
print(f"[CivicResQ] Looking for frontend build at: {FRONTEND_BUILD_DIR}")
print(f"[CivicResQ] Exists: {os.path.exists(FRONTEND_BUILD_DIR)}")
if os.path.exists(FRONTEND_BUILD_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_BUILD_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def fail_grace():
        return {"error": "Frontend build not generated. Run npm run build."}

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: Exception):
    if request.url.path.startswith("/api/"):
        return {"error": "API route not found"}
    index_file = os.path.join(FRONTEND_BUILD_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "404 Not Found"}
