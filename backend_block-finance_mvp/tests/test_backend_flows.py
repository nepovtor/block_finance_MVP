from __future__ import annotations

import pytest


async def register_user(client, phone: str, name: str = "Test User"):
    response = await client.post(
        "/auth/register",
        json={
            "name": name,
            "phone": phone,
            "password": "Password123",
            "personal_data_consent": True,
            "consent_version": "2026-04-privacy-v1",
        },
    )

    assert response.status_code == 200, response.text
    return response.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_registration_and_login(client):
    registered = await register_user(client, "+375291110001", "Alice")
    assert registered["token"]
    assert registered["user"]["name"] == "Alice"

    logged_in = await client.post(
        "/auth/login",
        json={"phone": "+375291110001", "password": "Password123"},
    )

    assert logged_in.status_code == 200, logged_in.text
    assert logged_in.json()["token"]


@pytest.mark.asyncio
async def test_registration_requires_personal_data_consent(client):
    response = await client.post(
        "/auth/register",
        json={
            "name": "No Consent",
            "phone": "+375291110002",
            "password": "Password123",
            "personal_data_consent": False,
            "consent_version": "2026-04-privacy-v1",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_consent_status_and_revoke(client):
    registered = await register_user(client, "+375291110003", "Consent User")
    headers = auth_headers(registered["token"])

    status_response = await client.get("/privacy/consent", headers=headers)
    assert status_response.status_code == 200, status_response.text
    assert status_response.json()["accepted"] is True

    revoke_response = await client.post("/privacy/consent/revoke", headers=headers)
    assert revoke_response.status_code == 200, revoke_response.text
    assert revoke_response.json()["accepted"] is False
    assert revoke_response.json()["revoked_at"] is not None


@pytest.mark.asyncio
async def test_delete_account(client):
    registered = await register_user(client, "+375291110004", "Delete User")
    headers = auth_headers(registered["token"])

    delete_response = await client.delete("/privacy/account", headers=headers)
    assert delete_response.status_code == 204, delete_response.text

    me_response = await client.get("/auth/me", headers=headers)
    assert me_response.status_code == 401


@pytest.mark.asyncio
async def test_start_finish_game_and_leaderboard(client):
    registered = await register_user(client, "+375291110005", "Leader User")
    headers = auth_headers(registered["token"])

    start_response = await client.post("/game/start", headers=headers)
    assert start_response.status_code == 200, start_response.text

    session_id = start_response.json()["session_id"]

    finish_response = await client.post(
        "/game/finish",
        headers=headers,
        params={
            "session_id": session_id,
            "score": 1500,
            "moves_used": 12,
            "extra_moves_used": 1,
        },
    )

    assert finish_response.status_code == 200, finish_response.text
    assert finish_response.json()["xp_gained"] == 1510

    leaderboard_response = await client.get("/game/leaderboard", params={"limit": 5})
    assert leaderboard_response.status_code == 200, leaderboard_response.text

    leaders = leaderboard_response.json()["leaders"]
    assert any(entry["name"] == "Leader User" and entry["score"] == 1500 for entry in leaders)


@pytest.mark.asyncio
async def test_reward_use_flow(client):
    registered = await register_user(client, "+375291110006", "Reward User")
    headers = auth_headers(registered["token"])

    transaction_response = await client.post(
        "/transactions/demo",
        json={"amount": 7.5, "category": "coffee"},
        headers=headers,
    )

    assert transaction_response.status_code == 200, transaction_response.text
    assert transaction_response.json()["reward_granted"] is True

    reward_response = await client.post(
        "/rewards/use",
        params={"reward_type": "extra_move"},
        headers=headers,
    )

    assert reward_response.status_code == 200, reward_response.text
    assert reward_response.json()["reward_used"] is True
    assert reward_response.json()["reward"]["type"] == "extra_move"


@pytest.mark.asyncio
async def test_refresh_and_logout_revokes_refresh_tokens(client):
    registered = await register_user(client, "+375291119999", "Refresh User")
    refresh_token = registered["refresh_token"]

    refresh_response = await client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert refresh_response.status_code == 200, refresh_response.text

    refreshed = refresh_response.json()
    assert refreshed["access_token"]
    assert refreshed["refresh_token"]
    assert refreshed["refresh_token"] != refresh_token

    me_response = await client.get(
        "/auth/me",
        headers=auth_headers(refreshed["access_token"]),
    )

    assert me_response.status_code == 200, me_response.text

    logout_response = await client.post(
        "/auth/logout",
        headers=auth_headers(refreshed["access_token"]),
    )

    assert logout_response.status_code == 204, logout_response.text

    revoked_refresh_response = await client.post(
        "/auth/refresh",
        json={"refresh_token": refreshed["refresh_token"]},
    )

    assert revoked_refresh_response.status_code == 401


@pytest.mark.asyncio
async def test_finish_game_requires_owner_and_rejects_replay(client):
    registered = await register_user(client, "+375291110007", "Owner User")
    headers = auth_headers(registered["token"])

    start_response = await client.post("/game/start", headers=headers)
    assert start_response.status_code == 200, start_response.text

    session_id = start_response.json()["session_id"]

    unauthorized_finish = await client.post(
        "/game/finish",
        params={
            "session_id": session_id,
            "score": 100,
            "moves_used": 1,
            "extra_moves_used": 0,
        },
    )

    assert unauthorized_finish.status_code == 401

    finish_response = await client.post(
        "/game/finish",
        headers=headers,
        params={
            "session_id": session_id,
            "score": 100,
            "moves_used": 1,
            "extra_moves_used": 0,
        },
    )

    assert finish_response.status_code == 200, finish_response.text

    replay_response = await client.post(
        "/game/finish",
        headers=headers,
        params={
            "session_id": session_id,
            "score": 120,
            "moves_used": 2,
            "extra_moves_used": 0,
        },
    )

    assert replay_response.status_code == 409


@pytest.mark.asyncio
async def test_finish_game_rejects_suspicious_score(client):
    registered = await register_user(client, "+375291110008", "Anti Cheat User")
    headers = auth_headers(registered["token"])

    start_response = await client.post("/game/start", headers=headers)
    assert start_response.status_code == 200, start_response.text

    session_id = start_response.json()["session_id"]

    finish_response = await client.post(
        "/game/finish",
        headers=headers,
        params={
            "session_id": session_id,
            "score": 999999,
            "moves_used": 1,
            "extra_moves_used": 0,
        },
    )

    assert finish_response.status_code == 422
