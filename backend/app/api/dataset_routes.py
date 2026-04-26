from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.dataset_service import DatasetService, DatasetItemService
from app.schemas.dataset_schema import DatasetCreate, DatasetItemCreate

router = APIRouter()


@router.post("/dataset")
def create_dataset(req: DatasetCreate, db: Session = Depends(get_db)):
    dataset = DatasetService.create_dataset(db, req.name, req.description)

    return {
        "id": dataset.id,
        "name": dataset.name
    }


@router.post("/dataset/{dataset_id}/item")
def add_dataset_item(
    dataset_id: str,
    req: DatasetItemCreate,
    db: Session = Depends(get_db)
):
    item = DatasetItemService.add_item(
        db,
        dataset_id,
        req.input,
        req.expected_output
    )

    return {
        "id": item.id,
        "dataset_id": item.dataset_id
    }