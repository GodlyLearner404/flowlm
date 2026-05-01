from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()

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
def list_dataset_items(dataset_id: str, db: Session = Depends(get_db)):
    items = db.query(DatasetItem).filter(DatasetItem.dataset_id == dataset_id).all()

    return [
        {
            "id": item.id,
            "dataset_id": item.dataset_id,
            "input": item.input,
            "expected_output": item.expected_output
        }
        for item in items
    ]
