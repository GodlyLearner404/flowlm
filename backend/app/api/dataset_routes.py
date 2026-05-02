from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.services.dataset_service import DatasetService, DatasetItemService
from app.schemas.dataset_schema import DatasetCreate, DatasetItemCreate
from app.models.dataset import Dataset
from app.models.dataset_item import DatasetItem

router = APIRouter()


@router.post("/dataset")
def create_dataset(req: DatasetCreate, db: Session = Depends(get_db)):
    dataset = DatasetService.create_dataset(db, req.name, req.description)

    return {
        "id": dataset.id,
        "name": dataset.name
    }


@router.get("/datasets")
def list_datasets(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    datasets = (
        db.query(Dataset)
        .options(joinedload(Dataset.items))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "items": [
                {
                    "id": item.id,
                    "input": item.input,
                    "expected_output": item.expected_output
                }
                for item in dataset.items
            ]
        }
        for dataset in datasets
    ]


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


@router.get("/dataset/{dataset_id}/items")
def list_dataset_items(
    dataset_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    items = (
        db.query(DatasetItem)
        .filter(DatasetItem.dataset_id == dataset_id)
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": item.id,
            "dataset_id": item.dataset_id,
            "input": item.input,
            "expected_output": item.expected_output
        }
        for item in items
    ]
