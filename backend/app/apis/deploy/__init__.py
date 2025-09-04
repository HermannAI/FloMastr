

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.auth import AuthorizedUser
from app.libs.auth_utils import is_super_admin  # Use centralized function
import asyncpg
import databutton as db

router = APIRouter()
