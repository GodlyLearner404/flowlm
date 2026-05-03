from sqlalchemy.orm import Session
from app.models.dataset import Dataset
import uuid
from datetime import datetime
from app.models.dataset_item import DatasetItem


class DatasetItemService:

    @staticmethod
    def add_item(db: Session, dataset_id: str, input_data: dict, expected_output: str = None):
        item = DatasetItem(
            id=str(uuid.uuid4()),
            dataset_id=dataset_id,
            input=input_data,
            expected_output=expected_output,
            created_at=datetime.utcnow()
        )

        db.add(item)
        db.commit()
        db.refresh(item)

        return item


class DatasetService:

    @staticmethod
    def create_dataset(db: Session, name: str, description: str = None, user_id: str = None):
        dataset = Dataset(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            user_id=user_id,
            created_at=datetime.utcnow()
        )

        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return dataset