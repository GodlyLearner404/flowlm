from sqlalchemy.orm import Session
from app.models.experiment import Experiment
from app.models.run import Run
from collections import defaultdict


class AnalyticsService:

    @staticmethod

    def get_experiment_summary(db: Session, experiment_id: str, user_id:str):
        runs = db.query(Run).join(Experiment).filter(
            Run.experiment_id == experiment_id,
            Experiment.user_id == user_id   # 🔥 ADD THIS
        ).all()

        groups = defaultdict(list)

        for run in runs:
            if run.score is not None:
                groups[run.prompt_version_id].append(run.score)

        result = []

        for version_id, scores in groups.items():
            avg = sum(scores) / len(scores) if scores else None

            result.append({
                "prompt_version_id": version_id,
                "num_runs": len(scores),
                "avg_score": avg
            })

        # 🔥 FIND WINNER
        winner = None
        if result:
            winner = max(result, key=lambda x: x["avg_score"] or 0)

        scored_runs = [run.score for run in runs if run.score is not None]
        avg_score = sum(scored_runs) / len(scored_runs) if scored_runs else None

        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()

        return {
            "experiment_id": experiment_id,
            "num_runs": len(runs),
            "avg_score": avg_score,
            "versions": result,
            "winner": winner,
            "saved_winner": experiment.best_prompt_version_id if experiment else None
        }

    @staticmethod
    def compare_experiments(db: Session, limit: int = 50, offset: int = 0, user_id: str = None):
        experiments = db.query(Experiment).filter(Experiment.user_id == user_id).offset(offset).limit(limit).all()

        results = []

        for exp in experiments:
            summary = AnalyticsService.get_experiment_summary(db, exp.id, user_id)
            results.append({
                "experiment_id": exp.id,
                "num_runs": summary["num_runs"],
                "avg_score": summary["avg_score"],
                "winner": summary["winner"]
            })

        return sorted(results, key=lambda x: (x["avg_score"] or 0), reverse=True)
