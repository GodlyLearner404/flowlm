# AGENTS.md

Guidance for Codex and other AI coding agents working in the FlowLM repository.

## Repository Architecture

FlowLM is split into a FastAPI backend and React frontend.

- `backend/`: FastAPI API service with SQLAlchemy models, Alembic migrations, Celery async tasks, PostgreSQL persistence, Redis task infrastructure, and OpenRouter-based LLM execution.
- `flowlm-frontend/`: React frontend for prompt management, playground workflows, experiments, analytics, and deployment UI.
- Database: PostgreSQL.
- Async runtime: Celery backed by Redis.
- LLM execution: OpenRouter client code under `backend/app/llm/`, orchestrated through backend services.

## Engineering Conventions

- Keep API routes thin.
- Put business logic in `backend/app/services/`.
- Keep SQLAlchemy models focused on schema and relationships only.
- Avoid embedding workflow or domain logic in API route handlers.
- Preserve ownership filtering with `user_id` whenever reading or mutating user-owned data.
- Maintain minimal diffs and respect existing architecture.
- Prefer existing service, schema, and route patterns before introducing new abstractions.
- Keep behavior backward compatible when possible.

## Codex Behavior Constraints

- Do not rewrite unrelated code.
- Preserve existing formatting and file structure where practical.
- Modify only the requested files, functions, or smallest necessary surface.
- Prefer surgical edits over broad rewrites.
- Avoid unnecessary import reordering.
- Avoid broad refactors unless explicitly requested.
- Do not change public API contracts unless the task requires it.
- Do not remove user changes or unrelated work in a dirty worktree.
- If a change requires touching an unrequested file, make the reason explicit.
- Prefer focused, architecture-preserving changes.
- You may introduce small helper functions, local refactors, and implementation improvements when they materially improve correctness or maintainability.
- Avoid broad rewrites or unrelated refactors unless explicitly requested.

## Database Conventions

- Always use Alembic migrations for schema changes.
- Prefer JSONB for flexible prompt configs, model configs, metadata, and variable-shaped payloads.
- Never directly modify the production schema manually.
- Keep migrations focused, reversible when practical, and aligned with SQLAlchemy models.
- Validate foreign keys and ownership constraints for deployment, execution, and experiment data.

## Frontend Conventions

- API request logic belongs in `flowlm-frontend/src/api.js`.
- React components should remain focused on UI state and rendering.
- Avoid giant React components; extract focused components when a file becomes difficult to reason about.
- Preserve the current frontend architecture unless a task explicitly asks for restructuring.
- Keep frontend changes compatible with existing backend response shapes when possible.
- Display backend errors clearly without crashing comparison or playground workflows.

## Verification Expectations

- Verify Python imports and syntax for touched backend files.
- Verify React build or targeted frontend checks when touching frontend code.
- Avoid breaking existing routes while adding new endpoints.
- Maintain backward compatibility where possible.
- Check SQLAlchemy mapper behavior after adding or changing relationships.
- Confirm Alembic migrations apply cleanly when schema changes are included.

## Completion Criteria

A task is complete when:

- The requested feature works end to end.
- The app can run with the changed code.
- Required migrations exist and succeed.
- Existing routes and workflows remain intact.
- No unrelated changes were introduced.
- The final response names what changed and how it was verified.

## Incremental Change Policy

AI coding agents must prefer:

- small localized edits
- one subsystem at a time
- one feature slice at a time

Avoid:

- broad cross-project rewrites
- touching many files unless necessary
- reformatting unrelated code

Prefer:

- extending existing architecture
- preserving APIs
- preserving current UX patterns

When possible:

- modify one file per task
- isolate backend and frontend changes separately

Minimize token usage by:

- avoiding unnecessary code regeneration
- avoiding import reordering
- avoiding duplicate rewrites
