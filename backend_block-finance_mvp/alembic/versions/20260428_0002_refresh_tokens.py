from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260428_0002"
down_revision = "20260428_0001"
branch_labels = None
depends_on = None


def table_exists(bind, table_name: str) -> bool:
    return inspect(bind).has_table(table_name)


def index_names(bind, table_name: str) -> set[str]:
    if not table_exists(bind, table_name):
        return set()

    return {index["name"] for index in inspect(bind).get_indexes(table_name)}


def create_index_if_missing(bind, index_name: str, table_name: str, columns: list[str], unique: bool = False) -> None:
    if index_name not in index_names(bind, table_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    bind = op.get_bind()

    if not table_exists(bind, "refresh_tokens"):
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("token_hash", sa.String(), nullable=False),
            sa.Column("jti", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column("ip_hash", sa.String(), nullable=True),
            sa.Column("user_agent_hash", sa.String(), nullable=True),
        )

    create_index_if_missing(bind, "ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    create_index_if_missing(bind, "ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)
    create_index_if_missing(bind, "ix_refresh_tokens_jti", "refresh_tokens", ["jti"], unique=True)
    create_index_if_missing(bind, "ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_table("refresh_tokens")
