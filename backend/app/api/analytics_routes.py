from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/experiment/{experiment_id}/summary")
def get_summary(experiment_id: str, db: Session = Depends(get_db)):
    return AnalyticsService.get_experiment_summary(db, experiment_id)


@router.get("/experiments/compare")
def compare(db: Session = Depends(get_db)):
    return AnalyticsService.compare_experiments(db)