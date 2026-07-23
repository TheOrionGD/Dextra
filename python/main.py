import os
os.environ["GLOG_minloglevel"] = "3"           # Suppress MediaPipe C++ Clearcut telemetry logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"       # Suppress TensorFlow C++ log warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1" # Suppress HuggingFace Hub Windows symlink warning

import argparse
import sys
import time
from rich.console import Console
from rich.panel import Panel
import uvicorn

# Import services
from gesture_mouse import mouse_service
from voice_commands import voice_service
from gui_server import app

console = Console()

def print_banner():
    banner = """
[bold cyan]██████╗ ███████╗██╗  ██╗████████╗██████╗  █████╗ 
██╔══██╗██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗
██║  ██║█████╗   ╚███╔╝    ██║   ██████╔╝███████║
██║  ██║██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║
██████╔╝███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║
╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝[/bold cyan]
[bold white]Control Without Contact[/bold white]
    """
    console.print(Panel(banner, title="DEXTRA System Launcher", border_style="cyan"))

def start_all():
    console.print("[green]Starting DEXTRA Services in Standby Mode...[/green]")
    console.print("[yellow]Waiting for frontend permission to activate Camera & Microphone.[/yellow]")
    
    console.print("[green]Starting FastAPI Backend Server on port 8000...[/green]")
    # uvicorn.run blocks the main thread
    uvicorn.run(app, host="0.0.0.0", port=8000)

def main():
    parser = argparse.ArgumentParser(description="DEXTRA CLI Launcher")
    parser.add_argument("--gui", action="store_true", help="Run only the GUI server")
    parser.add_argument("--mouse", action="store_true", help="Run only the gesture mouse tracker")
    parser.add_argument("--voice", action="store_true", help="Run only the voice commands listener")
    parser.add_argument("--all", action="store_true", help="Run all modules")
    
    args = parser.parse_args()
    
    print_banner()

    if args.gui:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    elif args.mouse:
        mouse_service.start()
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            mouse_service.stop()
    elif args.voice:
        voice_service.start()
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            voice_service.stop()
    elif args.all:
        start_all()
    else:
        # Interactive Menu
        console.print("[1] Run All Modules (Gesture + Voice + API)")
        console.print("[2] Run Gesture Mouse Tracker Only")
        console.print("[3] Run Voice Commands Only")
        console.print("[4] Run FastAPI Server Only")
        console.print("[5] Exit")
        
        choice = console.input("[bold yellow]Select an option: [/bold yellow]")
        
        if choice == "1":
            start_all()
        elif choice == "2":
            mouse_service.start()
            try:
                while True: time.sleep(1)
            except KeyboardInterrupt:
                mouse_service.stop()
        elif choice == "3":
            voice_service.start()
            try:
                while True: time.sleep(1)
            except KeyboardInterrupt:
                voice_service.stop()
        elif choice == "4":
            uvicorn.run(app, host="0.0.0.0", port=8000)
        else:
            console.print("[red]Exiting...[/red]")
            sys.exit(0)

if __name__ == "__main__":
    main()

