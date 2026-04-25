from fastapi import FastAPI
from app.core.database import engine

app = FastAPI()

@app.get("/")
def root():
    return {"message": "FlowLM backend running"}