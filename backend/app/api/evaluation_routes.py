from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.evaluation_service import EvaluationService

router = APIRouter()


class EvaluatorCreateRequest(BaseModel):
    project_id: str
    name: str
    description: str | None = None
    judge_model: str
    evaluation_prompt: str


class EvaluationRunRequest(BaseModel):
    evaluator_id: str
    input_text: str | None = None
    output_text: str
    playground_run_id: str | None = None
    experiment_run_id: str | None = None


def _serialize_evaluator(evaluator):
    return {
        "id": evaluator.id,
        "project_id": evaluator.project_id,
        "name": evaluator.name,
        "description": evaluator.description,
        "judge_model": evaluator.judge_model,
        "evaluation_prompt": evaluator.evaluation_prompt,
        "created_by_user_id": evaluator.created_by_user_id,
        "created_at": evaluator.created_at
    }


@router.post("/evaluators")
def create_evaluator(
    req: EvaluatorCreateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    evaluator = EvaluationService.create_evaluator(
        db,
        req.project_id,
        req.name,
        req.description,
        req.judge_model,
        req.evaluation_prompt,
        user_id
    )

    if not evaluator:
        raise HTTPException(status_code=403, detail="Project access denied")

    return _serialize_evaluator(evaluator)


@router.get("/evaluators")
def list_evaluators(
    project_id: str = Query(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    evaluators = EvaluationService.list_evaluators(db, project_id, user_id)

    if evaluators is None:
        raise HTTPException(status_code=403, detail="Project access denied")

    return [_serialize_evaluator(evaluator) for evaluator in evaluators]


@router.post("/evaluations/run")
def run_evaluation(
    req: EvaluationRunRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        evaluation, metadata = EvaluationService.run_evaluation(
            db,
            req.evaluator_id,
            req.output_text,
            req.input_text,
            user_id,
            req.playground_run_id,
            req.experiment_run_id
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    return {
        "id": evaluation.id,
        "evaluator_id": evaluation.evaluator_id,
        "score": evaluation.score,
        "reasoning": evaluation.reasoning,
        "raw_judge_response": evaluation.raw_judge_response,
        "tokens": metadata["tokens"],
        "finish_reason": metadata["finish_reason"],
        "latency_ms": metadata["latency_ms"],
        "created_at": evaluation.created_at
    }
