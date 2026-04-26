from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.experiment_service import ExperimentService

router = APIRouter()


@router.post("/experiment/run")
def run_experiment(prompt_version_id: str, dataset_id: str, db: Session = Depends(get_db)):
    return ExperimentService.run_experiment(db, prompt_version_id, dataset_id)