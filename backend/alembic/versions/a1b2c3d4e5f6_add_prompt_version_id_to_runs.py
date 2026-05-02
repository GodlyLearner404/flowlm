"""add prompt version id to runs

Revision ID: a1b2c3d4e5f6
Revises: 6e98ec2ccb5b
Create Date: 2026-05-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "6e98ec2ccb5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("runs", sa.Column("prompt_version_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_runs_prompt_version_id_prompt_versions",
        "runs",
        "prompt_versions",
        ["prompt_version_id"],
        ["id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_runs_prompt_version_id_prompt_versions", "runs", type_="foreignkey")
    op.drop_column("runs", "prompt_version_id")
