import json
import re

from sqlalchemy.orm import Session

from app.models.evaluation import Evaluation
from app.models.evaluator import Evaluator
from app.models.experiment import Experiment
from app.models.playground_run import PlaygroundRun
from app.models.run import Run
from app.services.execution_service import ExecutionService
from app.services.project_service import ProjectService


class EvaluationService:

    @staticmethod
    def create_evaluator(
        db: Session,
        project_id: str,
        name: str,
        description: str | None,
        judge_model: str,
        evaluation_prompt: str,
        user_id: str
    ):
        if not ProjectService.is_project_member(db, project_id, user_id):
            return None

        evaluator = Evaluator(
            project_id=project_id,
            name=name,
            description=description,
            judge_model=judge_model,
            evaluation_prompt=evaluation_prompt,
            created_by_user_id=user_id
        )

        db.add(evaluator)
        db.commit()
        db.refresh(evaluator)

        return evaluator

    @staticmethod
    def list_evaluators(db: Session, user_id: str, project_id: str | None = None):
        if project_id and not ProjectService.is_project_member(db, project_id, user_id):
            return None

        query = db.query(Evaluator)

        if project_id:
            query = query.filter(Evaluator.project_id == project_id)
        else:
            user_projects = ProjectService.get_user_projects(db, user_id)
            project_ids = [project.id for project in user_projects]

            if not project_ids:
                return []

            query = query.filter(Evaluator.project_id.in_(project_ids))

        return (
            query
            .order_by(Evaluator.created_at.desc())
            .all()
        )

    @staticmethod
    def run_evaluation(
        db: Session,
        evaluator_id: str,
        output_text: str,
        input_text: str | None,
        user_id: str,
        playground_run_id: str | None = None,
        experiment_run_id: str | None = None
    ):
        evaluator = db.query(Evaluator).filter(Evaluator.id == evaluator_id).first()

        if not evaluator:
            raise LookupError("Evaluator not found")

        if not ProjectService.is_project_member(db, evaluator.project_id, user_id):
            raise PermissionError("Project access denied")

        if playground_run_id:
            playground_run = db.query(PlaygroundRun).filter(
                PlaygroundRun.id == playground_run_id,
                PlaygroundRun.project_id == evaluator.project_id
            ).first()

            if not playground_run:
                raise ValueError("Invalid playground run")

        if experiment_run_id:
            experiment_run = (
                db.query(Run)
                .join(Experiment, Experiment.id == Run.experiment_id)
                .filter(
                    Run.id == experiment_run_id,
                    Experiment.project_id == evaluator.project_id
                )
                .first()
            )

            if not experiment_run:
                raise ValueError("Invalid experiment run")

        judge_prompt = EvaluationService._build_judge_prompt(
            evaluator.evaluation_prompt,
            input_text,
            output_text
        )

        raw_judge_response, tokens, finish_reason, latency_ms = ExecutionService.run_prompt(
            judge_prompt,
            evaluator.judge_model,
            {"temperature": 0, "max_tokens": 550}
        )

        score, reasoning = EvaluationService._parse_judge_response(raw_judge_response)

        evaluation = Evaluation(
            evaluator_id=evaluator.id,
            playground_run_id=playground_run_id,
            experiment_run_id=experiment_run_id,
            input_text=input_text,
            output_text=output_text,
            score=score,
            reasoning=reasoning,
            raw_judge_response=raw_judge_response
        )

        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)

        return evaluation, {
            "tokens": tokens,
            "finish_reason": finish_reason,
            "latency_ms": latency_ms
        }

    @staticmethod
    def _build_judge_prompt(evaluation_prompt: str, input_text: str | None, output_text: str):
        candidate_input = input_text if input_text else "(no input provided)"

        return f"""
            You are an impartial LLM judge.

            Evaluation criteria:
            {evaluation_prompt}

            Candidate input:
            {candidate_input}

            Candidate output:
            {output_text}

            Strict scoring instruction:
            - Follow the evaluation criteria exactly.
            - if the output are multiple for different models give multiple scoring and reasoning for each output. Also mention number of output in front.
            - Return one numerical score using the scale implied by the criteria.
            - Return concise reasoning tied to the candidate output.
            - Return ONLY valid JSON with keys "score" and "reasoning".
            - Do not include markdown, code fences, or extra commentary.
            """.strip()

    @staticmethod
    def _parse_judge_response(raw_response: str):
        parsed = EvaluationService._parse_json_response(raw_response)

        if isinstance(parsed, dict):
            score = EvaluationService._coerce_score(parsed.get("score"))
            reasoning = parsed.get("reasoning")

            if score is not None:
                return score, reasoning if isinstance(reasoning, str) else raw_response.strip()

        score_match = re.search(r"-?\d+(?:\.\d+)?", raw_response or "")
        score = float(score_match.group(0)) if score_match else None

        reasoning_match = re.search(
            r"reasoning\s*[:=-]\s*(.+)",
            raw_response or "",
            re.IGNORECASE | re.DOTALL
        )
        reasoning = reasoning_match.group(1).strip() if reasoning_match else (raw_response or "").strip()

        return score, reasoning

    @staticmethod
    def _parse_json_response(raw_response: str):
        if not raw_response:
            return None

        cleaned = raw_response.strip()

        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            return json.loads(cleaned)
        except Exception:
            pass

        match = re.search(r"\{.*\}", cleaned, re.DOTALL)

        if not match:
            return None

        try:
            return json.loads(match.group(0))
        except Exception:
            return None

    @staticmethod
    def _coerce_score(value):
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None
