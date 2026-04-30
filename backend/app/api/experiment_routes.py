from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.experiment_service import ExperimentService

router = APIRouter()


@router.post("/experiment/run")
def run_experiment(
    prompt_version_id: str,
    dataset_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # create experiment first
    experiment = ExperimentService.create_experiment(
        db, prompt_version_id, dataset_id
    )

    # run in background
    background_tasks.add_task(
        ExperimentService.execute_experiment,
        experiment.id
    )

    return {
        "experiment_id": experiment.id,
        "status": "started"
    }