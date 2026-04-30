from app.celery_app import celery
from app.services.experiment_service import ExperimentService

@celery.task(name="app.tasks.experiment_tasks.run_experiment_task")
def run_experiment_task(experiment_id: str):
    ExperimentService.execute_experiment(experiment_id)