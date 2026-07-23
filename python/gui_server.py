import asyncio
import json
import os
import uvicorn
import queue
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import SettingsManager
from gesture_mouse import mouse_service
from voice_commands import voice_status_queue, voice_service
from metadata import BUILTIN_GESTURES, VOICE_CMD_CATEGORIES

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("Starting FastAPI server... (Engines in Standby)")
    # Engines now require explicit API call from frontend to start



settings_manager = SettingsManager()

@app.get("/settings")
async def get_settings():
    return JSONResponse(content=settings_manager.get_settings())

@app.post("/settings")
async def update_settings(new_settings: dict):
    success = settings_manager.update_settings(new_settings)
    if success:
        return JSONResponse(content={"status": "success", "message": "Configuration parameters persisted successfully."})
    return JSONResponse(content={"status": "error", "message": "Failed to update settings."}, status_code=500)

@app.get("/health")
async def get_health():
    return JSONResponse(content={"status": "ok"})

@app.get("/gestures")
async def get_gestures():
    return JSONResponse(content=settings_manager.get_custom_gestures())

@app.post("/gestures")
async def add_gesture(gesture: dict):
    gestures = settings_manager.get_custom_gestures()
    # Filter out existing gesture with same name
    gestures = [g for g in gestures if g.get("name") != gesture.get("name")]
    gestures.append(gesture)
    success = settings_manager.update_custom_gestures(gestures)
    if success:
        return JSONResponse(content={"status": "success"})
    return JSONResponse(content={"status": "error"}, status_code=500)

@app.delete("/gestures/{name}")
async def delete_gesture(name: str):
    gestures = settings_manager.get_custom_gestures()
    gestures = [g for g in gestures if g.get("name") != name]
    success = settings_manager.update_custom_gestures(gestures)
    if success:
        return JSONResponse(content={"status": "success"})
    return JSONResponse(content={"status": "error"}, status_code=500)

@app.get("/api/system-status")
async def get_system_status():
    settings = settings_manager.get_settings()
    custom_gestures = settings_manager.get_custom_gestures()
    return JSONResponse(content={
        "engine": "Ready" if mouse_service.running else "Standby",
        "camera": f"Index {settings.get('camera_index', 0)}",
        "voice_module": "Ready" if voice_service.running else "Standby",
        "smoothing": f"{settings.get('cursor_smoothing', 5)} frames",
        "click_threshold": f"{settings.get('click_threshold_px', 30)} px",
        "cooldown": f"{settings.get('cooldown_period_sec', 0.3)} s",
        "total_gestures": len(BUILTIN_GESTURES) + len(custom_gestures),
        "total_voice_commands": sum(len(cat["cmds"]) for cat in VOICE_CMD_CATEGORIES)
    })

@app.get("/api/all-gestures")
async def get_all_gestures():
    custom_gestures = settings_manager.get_custom_gestures()
    
    formatted_custom = []
    for g in custom_gestures:
        formatted_custom.append({
            "emoji": "🤚",
            "name": g.get("name", "Custom Gesture"),
            "desc": "User trained custom gesture",
            "action": g.get("action", "Unknown"),
            "category": "Custom"
        })
    
    all_gestures = BUILTIN_GESTURES + formatted_custom
    return JSONResponse(content=all_gestures)

@app.get("/api/voice-commands")
async def api_voice_commands():
    return JSONResponse(content=VOICE_CMD_CATEGORIES)

@app.post("/api/engines/start")
async def api_start_engines():
    try:
        mouse_service.start()
        voice_service.start()
        return JSONResponse(content={"status": "success", "message": "Engines started successfully."})
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.websocket("/trainer/stream")
async def trainer_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            frame, states = mouse_service.get_latest_frame_and_states()
            if frame:
                await websocket.send_text(json.dumps({"finger_states": states}))
                await websocket.send_bytes(frame)
            await asyncio.sleep(1/30.0)
    except (WebSocketDisconnect, asyncio.CancelledError):
        print("Trainer WebSocket client disconnected")

@app.websocket("/voice/stream")
async def voice_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        # Clear queue for fresh connection
        while not voice_status_queue.empty():
            voice_status_queue.get_nowait()
            
        while True:
            try:
                msg = voice_status_queue.get_nowait()
                if msg["type"] == "status":
                    await websocket.send_text(json.dumps({"type": "status", "state": msg["state"]}))
                elif msg["type"] == "transcription":
                    await websocket.send_text(json.dumps({"type": "transcript", "text": msg["text"]}))
                elif msg["type"] == "action":
                    # Send command log to UI
                    text = msg.get("text", "Command")
                    await websocket.send_text(json.dumps({"type": "command", "text": text, "action": msg["message"]}))
                else:
                    await websocket.send_text(json.dumps(msg))
            except queue.Empty:
                await asyncio.sleep(0.1)
    except (WebSocketDisconnect, asyncio.CancelledError):
        print("Voice WebSocket client disconnected")

# Mount static frontend
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'Frontend', 'dist')
if os.path.exists(FRONTEND_DIR):
    # Try to serve index.html for all 404s if possible, but StaticFiles handles basic serving
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")

if __name__ == "__main__":
    print("Starting DEXTRA FastAPI Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)


