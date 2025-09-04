


from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from enum import Enum
from datetime import datetime
import asyncpg
import databutton as db
from app.auth import AuthorizedUser

# Import centralized database connection
from app.libs.db_connection import get_db_connection

router = APIRouter()

def is_super_admin(user: AuthorizedUser) -> bool:
    """Check if user is a super admin"""
    super_admin_ids_str = db.secrets.get("SUPER_ADMIN_IDS")
    if not super_admin_ids_str:
        return False
    
    super_admin_ids = [id.strip() for id in super_admin_ids_str.split(',') if id.strip()]
    return user.sub in super_admin_ids

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    SUPER_ADMIN = "super_admin"

class UserRoleInfo(BaseModel):
    id: str  # Changed from int to str to handle UUID strings
    email: str
    role: UserRole
    assigned_by: Optional[str]
    assigned_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class UserRoleCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.USER

async def get_user_role(email: str) -> UserRole:
    """Get user role from database"""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT role FROM user_roles WHERE email = $1",
            email
        )
        if row:
            return UserRole(row['role'])
        return UserRole.USER  # Default role for new users
    finally:
        await conn.close()

@router.get("/users", response_model=List[UserRoleInfo])
async def list_users(user: AuthorizedUser) -> List[UserRoleInfo]:
    """List all users and their roles (Super-Admin only)"""
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Forbidden: Requires Super-Admin access")
    
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT id, email, role, assigned_by, assigned_at, created_at, updated_at
            FROM user_roles
            ORDER BY created_at DESC
            """
        )
        
        return [
            UserRoleInfo(
                id=str(row['id']),
                email=row['email'],
                role=UserRole(row['role']),
                assigned_by=row['assigned_by'],
                assigned_at=row['assigned_at'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            for row in rows
        ]
    finally:
        await conn.close()

@router.post("/users", response_model=UserRoleInfo)
async def create_user_role(user_data: UserRoleCreate, user: AuthorizedUser) -> UserRoleInfo:
    """Create a new user role assignment (Super-Admin only)"""
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Forbidden: Requires Super-Admin access")
    
    conn = await get_db_connection()
    try:
        # Check if user already exists
        existing = await conn.fetchrow(
            "SELECT id FROM user_roles WHERE email = $1",
            user_data.email
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="User role already exists")
        
        # Insert new user role
        row = await conn.fetchrow(
            """
            INSERT INTO user_roles (email, role, assigned_by)
            VALUES ($1, $2, $3)
            RETURNING id, email, role, assigned_by, assigned_at, created_at, updated_at
            """,
            user_data.email,
            user_data.role.value,
            user.email
        )
        
        return UserRoleInfo(
            id=str(row['id']),
            email=row['email'],
            role=UserRole(row['role']),
            assigned_by=row['assigned_by'],
            assigned_at=row['assigned_at'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    finally:
        await conn.close()

@router.get("/current-user-role")
async def get_current_user_role(user: AuthorizedUser) -> dict:
    """Get current user's role"""
    role = await get_user_role(user.email)
    return {
        "email": user.email,
        "role": role.value,
        "is_admin": role in [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        "is_super_admin": role == UserRole.SUPER_ADMIN
    }
