from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260428_0001"
down_revision = None
branch_labels = None
depends_on = None


def table_exists(bind, table_name: str) -> bool:
    return inspect(bind).has_table(table_name)


def column_names(bind, table_name: str) -> set[str]:
    if not table_exists(bind, table_name):
        return set()

    return {column["name"] for column in inspect(bind).get_columns(table_name)}


def index_names(bind, table_name: str) -> set[str]:
    if not table_exists(bind, table_name):
        return set()

    return {index["name"] for index in inspect(bind).get_indexes(table_name)}


def add_column_if_missing(bind, table_name: str, column: sa.Column) -> None:
    if column.name not in column_names(bind, table_name):
        op.add_column(table_name, column)


def create_index_if_missing(
    bind,
    index_name: str,
    table_name: str,
    columns: list[str],
    unique: bool = False,
) -> None:
    if index_name not in index_names(bind, table_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    bind = op.get_bind()

    if not table_exists(bind, "users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("phone", sa.String(), nullable=False),
            sa.Column("password_hash", sa.String(), nullable=True),
            sa.Column("auth_token", sa.String(), nullable=True),
            sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("streak", sa.Integer(), nullable=False, server_default="0"),
        )
    else:
        add_column_if_missing(bind, "users", sa.Column("password_hash", sa.String(), nullable=True))
        add_column_if_missing(bind, "users", sa.Column("auth_token", sa.String(), nullable=True))
        add_column_if_missing(bind, "users", sa.Column("level", sa.Integer(), nullable=False, server_default="1"))
        add_column_if_missing(bind, "users", sa.Column("xp", sa.Integer(), nullable=False, server_default="0"))
        add_column_if_missing(bind, "users", sa.Column("streak", sa.Integer(), nullable=False, server_default="0"))

    create_index_if_missing(bind, "ix_users_phone", "users", ["phone"], unique=True)
    create_index_if_missing(bind, "ix_users_auth_token", "users", ["auth_token"], unique=True)

    if not table_exists(bind, "transactions"):
        op.create_table(
            "transactions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("amount", sa.Numeric(), nullable=False),
            sa.Column("category", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("source", sa.String(), nullable=False, server_default="demo"),
        )

    if not table_exists(bind, "rewards"):
        op.create_table(
            "rewards",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("type", sa.String(), nullable=False),
            sa.Column("value", sa.Integer(), nullable=False),
            sa.Column("source", sa.String(), nullable=False),
            sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        )

    if not table_exists(bind, "game_sessions"):
        op.create_table(
            "game_sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("moves_used", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("extra_moves_used", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("finished_at", sa.DateTime(), nullable=True),
        )
    else:
        add_column_if_missing(bind, "game_sessions", sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"))
        add_column_if_missing(bind, "game_sessions", sa.Column("finished_at", sa.DateTime(), nullable=True))

    if not table_exists(bind, "user_consents"):
        op.create_table(
            "user_consents",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("consent_type", sa.String(), nullable=False),
            sa.Column("consent_version", sa.String(), nullable=False),
            sa.Column("accepted_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column("ip_hash", sa.String(), nullable=True),
            sa.Column("user_agent_hash", sa.String(), nullable=True),
        )

    create_index_if_missing(bind, "ix_user_consents_user_id", "user_consents", ["user_id"])
    create_index_if_missing(bind, "ix_user_consents_consent_type", "user_consents", ["consent_type"])


def downgrade() -> None:
    op.drop_table("user_consents")
    op.drop_table("game_sessions")
    op.drop_table("rewards")
    op.drop_table("transactions")
    op.drop_index("ix_users_auth_token", table_name="users")
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_table("users")
