from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.services.dataset_service import DatasetService, DatasetItemService
from app.schemas.dataset_schema import DatasetCreate, DatasetItemCreate
from app.models.dataset import Dataset
from app.models.dataset_item import DatasetItem
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/dataset")
def create_dataset(
    req: DatasetCreate,
    project_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    dataset = DatasetService.create_dataset(db, req.name, req.description, user_id, project_id)

    if not dataset:
        raise HTTPException(status_code=403, detail="Project access denied")

    return {
        "id": dataset.id,
        "name": dataset.name,
        "project_id": dataset.project_id
    }


@router.get("/datasets")
def list_datasets(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    datasets = (
        DatasetService.get_user_datasets(db, user_id)
        .options(joinedload(Dataset.items))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": dataset.id,
            "project_id": dataset.project_id,
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
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    item = DatasetItemService.add_item(
        db,
        dataset_id,
        req.input,
        req.expected_output,
        user_id
    )

    if not item:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return {
        "id": item.id,
        "dataset_id": item.dataset_id
    }


@router.get("/dataset/{dataset_id}/items")
def list_dataset_items(
    dataset_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset_for_user(db, dataset_id, user_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

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
