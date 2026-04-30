from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.experiment_service import ExperimentService
from app.tasks.experiment_tasks import run_experiment_task

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