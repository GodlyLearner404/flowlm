from fastapi import FastAPI
from app.core.database import engine
from app.api.prompt_routes import router as prompt_router
from app.api.dataset_routes import router as dataset_router
from app.api.experiment_routes import router as experiment_router
from app.api.analytics_routes import router as analytics_router

app = FastAPI()

app.include_router(prompt_router)
app.include_router(dataset_router)
app.include_router(experiment_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {"message": "FlowLM backend running"}