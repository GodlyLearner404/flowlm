from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.experiment_service import ExperimentService
from app.tasks.experiment_tasks import run_experiment_task
from app.models.dataset import Dataset
from app.models.experiment import Experiment
from app.models.prompt_version import PromptVersion
from app.models.run import Run
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/experiment/run")
def run_experiment(
    prompt_version_ids: list[str],
    dataset_id: str,
    project_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    # 🔥 Validate ALL prompt versions
    prompt_versions = ExperimentService.get_prompt_versions_for_project(
        db, prompt_version_ids, project_id, user_id
    )

    if len(prompt_versions) != len(prompt_version_ids):
        raise HTTPException(status_code=404, detail="One or more prompt versions are invalid")

    invalid_models = [
        version.model
        for version in prompt_versions
        if not version.model or version.model == "gpt-test" or "/" not in version.model
    ]

    if invalid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OpenRouter model id: {invalid_models[0]}"
        )

    # create experiment
    experiment = ExperimentService.create_experiment(
        db, prompt_version_ids, dataset_id, user_id, project_id
    )

    if not experiment:
        raise HTTPException(status_code=404, detail="Invalid project resources")

    # send task to Celery
    run_experiment_task.delay(experiment.id)

    return {
        "experiment_id": experiment.id,
        "project_id": experiment.project_id,
        "status": "queued"
    }


@router.get("/experiment/{experiment_id}/status")
def get_experiment_status(
    experiment_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    experiment = ExperimentService.get_experiment_for_user(db, experiment_id, user_id)

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    run_count = (
        db.query(func.count(Run.id))
        .filter(Run.experiment_id == experiment_id)
        .scalar()
    )

    return {
        "experiment_id": experiment.id,
        "status": experiment.status,
        "run_count": run_count
    }


@router.get("/experiment/{experiment_id}/runs")
def get_experiment_runs(
    experiment_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    experiment = ExperimentService.get_experiment_for_user(db, experiment_id, user_id)

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    runs = (
        db.query(Run)
        .filter(Run.experiment_id == experiment_id)
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": run.id,
            "experiment_id": run.experiment_id,
            "dataset_item_id": run.dataset_item_id,
            "input": run.input,
            "output": run.output,
            "score": run.score,
            "latency_ms": run.latency_ms,
            "extra_data": run.extra_data or {},
            "created_at": run.created_at
        }
        for run in runs
    ]
