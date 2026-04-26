from sqlalchemy.orm import Session
from app.models.experiment import Experiment
from app.models.run import Run


class AnalyticsService:

    @staticmethod
    def get_experiment_summary(db: Session, experiment_id: str):
        runs = db.query(Run).filter(Run.experiment_id == experiment_id).all()

        if not runs:
            return {"experiment_id": experiment_id, "avg_score": None}

        scores = [r.score for r in runs if r.score is not None]

        avg_score = sum(scores) / len(scores) if scores else None

        return {
            "experiment_id": experiment_id,
            "num_runs": len(runs),
            "avg_score": avg_score
        }

    @staticmethod
    def compare_experiments(db: Session):
        experiments = db.query(Experiment).all()

        results = []

        for exp in experiments:
            summary = AnalyticsService.get_experiment_summary(db, exp.id)
            results.append(summary)

        return sorted(results, key=lambda x: (x["avg_score"] or 0), reverse=True)