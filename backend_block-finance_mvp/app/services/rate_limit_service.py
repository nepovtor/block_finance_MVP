from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request

AUTH_WINDOW_SECONDS = 60
MAX_AUTH_REQUESTS_PER_WINDOW = 10
MAX_LOGIN_FAILURES = 5
LOGIN_LOCK_SECONDS = 900

_auth_windows: dict[str, list[float]] = defaultdict(list)
_login_failures: dict[str, dict[str, float]] = defaultdict(lambda: {"count": 0, "locked_until": 0})
_lock = Lock()


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return "unknown"


def normalize_phone_for_key(phone: str) -> str:
    digits = "".join(character for character in phone if character.isdigit())
    return digits or "unknown"


def enforce_auth_rate_limit(request: Request, scope: str, phone: str) -> None:
    now = time.monotonic()
    client_ip = get_client_ip(request)
    key = f"{scope}:{client_ip}:{normalize_phone_for_key(phone)}"
    fail_key = f"{client_ip}:{normalize_phone_for_key(phone)}"

    with _lock:
        failure_state = _login_failures[fail_key]
        if failure_state["locked_until"] > now:
            raise HTTPException(status_code=429, detail="Too many failed login attempts. Try again later.")

        window = [timestamp for timestamp in _auth_windows[key] if now - timestamp < AUTH_WINDOW_SECONDS]

        if len(window) >= MAX_AUTH_REQUESTS_PER_WINDOW:
            _auth_windows[key] = window
            raise HTTPException(status_code=429, detail="Too many authentication requests. Try again later.")

        window.append(now)
        _auth_windows[key] = window


def record_login_failure(phone: str, client_ip: str) -> None:
    now = time.monotonic()
    key = f"{client_ip}:{normalize_phone_for_key(phone)}"

    with _lock:
        state = _login_failures[key]
        state["count"] += 1

        if state["count"] >= MAX_LOGIN_FAILURES:
            state["locked_until"] = now + LOGIN_LOCK_SECONDS


def record_login_success(phone: str, client_ip: str) -> None:
    key = f"{client_ip}:{normalize_phone_for_key(phone)}"

    with _lock:
        _login_failures.pop(key, None)
