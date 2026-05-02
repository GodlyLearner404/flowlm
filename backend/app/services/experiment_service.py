from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.experiment import Experiment
from app.models.dataset_item import DatasetItem
from app.models.prompt_version import PromptVersion
from app.models.run import Run
from app.services.execution_service import ExecutionService
from app.evaluation.simple_evaluator import SimpleEvaluator
from app.evaluation.llm_evaluator import LLMEvaluator

import uuid
from datetime import datetime
from collections import defaultdict

def estimate_cost(tokens):
    if not tokens:
        return None
    return tokens * 0.0000005   # rough estimate

class ExperimentService:

    @staticmethod
    def run_experiment(db: Session, prompt_version_id: str, dataset_id: str):
        # create experiment
        experiment = Experiment(
            id=str(uuid.uuid4()),
            prompt_version_id=prompt_version_id,
            dataset_id=dataset_id,
            status="running",
            created_at=datetime.utcnow()
        )

        db.add(experiment)
        db.commit()
        db.refresh(experiment)

        # fetch data
        prompt_version = db.query(PromptVersion).filter(
            PromptVersion.id == prompt_version_id
        ).first()

        dataset_items = db.query(DatasetItem).filter(
            DatasetItem.dataset_id == dataset_id
        ).all()

        results = []

        for item in dataset_items:
            # run LLM
            final_prompt, output, tokens = ExecutionService.run(prompt_version, item.input)

            # score
            # score = SimpleEvaluator.score(output, item.expected_output)
            score = LLMEvaluator.score(output, item.expected_output) # Slows
            cost = estimate_cost(tokens)

            # save run
            run = Run(
                id=str(uuid.uuid4()),
                experiment_id=experiment.id,
                dataset_item_id=item.id,
                input=item.input,
                output=output,
                score=score,
                latency_ms=None,
                extra_data={},
                tokens_used=tokens,
                cost=cost,
                created_at=datetime.utcnow()
            )

            db.add(run)
            db.commit()

            results.append({
                "input": item.input,
                "output": output,
                "score": score
            })

        # mark complete
        experiment.status = "completed"
        db.commit()

        return {
            "experiment_id": experiment.id,
            "results": results
        }

    @staticmethod
    def execute_experiment(experiment_id: str):
        db = SessionLocal()

        try:
            experiment = db.query(Experiment).filter(
                Experiment.id == experiment_id
            ).first()

            if not experiment:
                return

            experiment.status = "running"
            db.commit()

            dataset_items = db.query(DatasetItem).filter(
                DatasetItem.dataset_id == experiment.dataset_id
            ).all()

            # 🔥 SUPPORT BOTH OLD + NEW (IMPORTANT)
            version_ids = (
                experiment.prompt_version_ids
                if experiment.prompt_version_ids
                else [experiment.prompt_version_id]
            )

            for version_id in version_ids:

                prompt_version = db.query(PromptVersion).filter(
                    PromptVersion.id == version_id
                ).first()

                for item in dataset_items:

                    final_prompt, output, tokens = ExecutionService.run(
                        prompt_version,
                        item.input
                    )

                    # score
                    # score = SimpleEvaluator.score(output, item.expected_output)
                    score = LLMEvaluator.score(output, item.expected_output) # Slows

                    run = Run(
                        id=str(uuid.uuid4()),
                        experiment_id=experiment.id,
                        prompt_version_id=version_id,  # 🔥 IMPORTANT
                        dataset_item_id=item.id,
                        input=item.input,
                        output=output,
                        score=score,
                        tokens_used=tokens,
                        created_at=datetime.utcnow()
                    )

                    db.add(run)
                    db.commit()

            # 🔥 compute winner after all runs
            runs = db.query(Run).filter(Run.experiment_id == experiment.id).all()

            groups = defaultdict(list)

            for run in runs:
                if run.score is not None:
                    groups[run.prompt_version_id].append(run.score)

            best_version = None
            best_score = -1

            for version_id, scores in groups.items():
                avg = sum(scores) / len(scores)

                if avg > best_score:
                    best_score = avg
                    best_version = version_id

            # 🔥 save winner
            experiment.best_prompt_version_id = best_version
            experiment.status = "completed"
            db.commit()

        except Exception:
            db.rollback()
            experiment = db.query(Experiment).filter(
                Experiment.id == experiment_id
            ).first()
            if experiment:
                experiment.status = "failed"
                db.commit()
            raise

        finally:
            db.close()

    @staticmethod
    def create_experiment(db, prompt_version_ids, dataset_id, user_id):
        experiment = Experiment(
            id=str(uuid.uuid4()),
            prompt_version_id=prompt_version_ids[0],
            prompt_version_ids=prompt_version_ids,
            dataset_id=dataset_id,
            user_id=user_id,
            status="pending",
            created_at=datetime.utcnow()
        )

        db.add(experiment)
        db.commit()
        db.refresh(experiment)

        return experiment
    
