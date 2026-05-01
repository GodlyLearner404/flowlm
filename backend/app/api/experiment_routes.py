from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.experiment_service import ExperimentService
from app.tasks.experiment_tasks import run_experiment_task
from app.models.experiment import Experiment
from app.models.run import Run

router = APIRouter()


@router.post("/experiment/run")
def run_experiment(
    prompt_version_id: str,
    dataset_id: str,
    db: Session = Depends(get_db)
):
    # create experiment
    experiment = ExperimentService.create_experiment(
        db, prompt_version_id, dataset_id
    )

    # send task to Celery
    run_experiment_task.delay(experiment.id)

    return {
        "experiment_id": experiment.id,
        "status": "queued"
    }


@router.get("/experiment/{experiment_id}/status")
def get_experiment_status(experiment_id: str, db: Session = Depends(get_db)):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()

    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    run_count = db.query(Run).filter(Run.experiment_id == experiment_id).count()

    return {
        "experiment_id": experiment.id,
        "status": experiment.status,
        "run_count": run_count
    }


@router.get("/experiment/{experiment_id}/runs")
def get_experiment_runs(experiment_id: str, db: Session = Depends(get_db)):
    runs = db.query(Run).filter(Run.experiment_id == experiment_id).all()

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
