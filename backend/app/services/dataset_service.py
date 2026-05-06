from sqlalchemy.orm import Session
from app.models.dataset import Dataset
import uuid
from datetime import datetime
from app.models.dataset_item import DatasetItem
from app.models.project_member import ProjectMember


class DatasetItemService:

    @staticmethod
    def add_item(db: Session, dataset_id: str, input_data: dict, expected_output: str = None, user_id: str = None):
        if user_id and not DatasetService.get_dataset_for_user(db, dataset_id, user_id):
            return None

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
    def user_is_project_member(db: Session, project_id: str, user_id: str):
        return db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        ).first() is not None

    @staticmethod
    def create_dataset(db: Session, name: str, description: str = None, user_id: str = None, project_id: str = None):
        if not DatasetService.user_is_project_member(db, project_id, user_id):
            return None

        dataset = Dataset(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            user_id=user_id,
            project_id=project_id,
            created_at=datetime.utcnow()
        )

        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        return dataset

    @staticmethod
    def get_user_datasets(db: Session, user_id: str):
        return (
            db.query(Dataset)
            .join(ProjectMember, ProjectMember.project_id == Dataset.project_id)
            .filter(ProjectMember.user_id == user_id)
        )

    @staticmethod
    def get_dataset_for_user(db: Session, dataset_id: str, user_id: str):
        return (
            db.query(Dataset)
            .join(ProjectMember, ProjectMember.project_id == Dataset.project_id)
            .filter(
                Dataset.id == dataset_id,
                ProjectMember.user_id == user_id
            )
            .first()
        )
