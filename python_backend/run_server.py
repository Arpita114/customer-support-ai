"""Simple server runner."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from app.main import app
from app.config import HOST, PORT
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
