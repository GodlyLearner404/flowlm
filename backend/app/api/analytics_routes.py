from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/experiment/{experiment_id}/summary")
def get_summary(experiment_id: str, db: Session = Depends(get_db)):
    return AnalyticsService.get_experiment_summary(db, experiment_id)


@router.get("/experiments/compare")
def compare(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return AnalyticsService.compare_experiments(db, limit, offset)
