from celery import Celery

celery = Celery(
    "flowlm",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

# ✅ EITHER use include (most reliable)
celery.conf.update(
    imports=["app.tasks.experiment_tasks"]
)

# (optional) keep autodiscover too
# celery.autodiscover_tasks(["app.tasks"])