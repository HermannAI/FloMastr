

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.auth import AuthorizedUser
from app.libs.auth_utils import is_super_admin  # Use centralized function
import asyncpg

router = APIRouter()
