"""
Analytics API router.

Exposes analytics endpoints that are part of the Ops tag group.
Core analytics endpoints (/analytics/event, /analytics/summary) are defined in main.py
since they depend on the app-level rate limiter and shared state.
"""
from fastapi import APIRouter

router = APIRouter()
