#!/usr/bin/env python3
"""
FloMastr Backend Launcher
This script ensures we start the backend from the correct directory with proper environment
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # Ensure we're in the backend directory
    backend_dir = Path(__file__).parent.absolute()
    os.chdir(backend_dir)
    
    print(f"🚀 Starting FloMastr Backend from: {backend_dir}")
    
    # Set up the database connection
    os.environ["DATABASE_URL"] = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    
    # Verify main.py exists
    main_py = backend_dir / "main.py"
    if not main_py.exists():
        print(f"❌ ERROR: main.py not found in {backend_dir}")
        sys.exit(1)
    
    print("✅ Found main.py")
    print("✅ Database URL configured")
    print("✅ Starting uvicorn server on http://localhost:8000...")
    print()
    
    # Start the server
    try:
        cmd = [
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ]
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
