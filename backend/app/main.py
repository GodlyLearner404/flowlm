from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.api.prompt_routes import router as prompt_router
from app.api.dataset_routes import router as dataset_router
from app.api.experiment_routes import router as experiment_router
from app.api.analytics_routes import router as analytics_router
from app.api.auth_routes import router as auth_router
from app.api.playground_routes import router as playground_router
from app.api.deployment_routes import router as deployment_router
from app.api.project_routes import router as project_router
from app.api.api_key_routes import router as api_key_router
from app.api.evaluation_routes import router as evaluation_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prompt_router)
app.include_router(dataset_router)
app.include_router(experiment_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(playground_router)
app.include_router(deployment_router)
app.include_router(project_router)
app.include_router(api_key_router)
app.include_router(evaluation_router)

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "FlowLM",
        "version": "v1"
    }
