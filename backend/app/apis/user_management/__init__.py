


from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime
import asyncpg
from app.libs.clerk_auth import get_authorized_user, ClerkUser

# Import centralized database connection
from app.libs.db_connection import get_db_connection

router = APIRouter()

def is_super_admin(user: ClerkUser) -> bool:
    """Check if user is a super admin"""
    import os

    # Check by email (same as tenant resolution API)
    super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS")
    if super_admin_emails_str:
        super_admin_emails = [e.strip().lower() for e in super_admin_emails_str.split(',') if e.strip()]
        user_email = user.email
        if user_email and user_email.lower() in super_admin_emails:
            return True

    return False

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
    email: str
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
async def list_users(request: Request, user: ClerkUser = Depends(get_authorized_user)) -> List[UserRoleInfo]:
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
async def create_user_role(request: Request, user_data: UserRoleCreate, user: ClerkUser = Depends(get_authorized_user)) -> UserRoleInfo:
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

@router.get("/me/role", response_model=dict)
async def get_current_user_role(request: Request, user: ClerkUser = Depends(get_authorized_user)) -> dict:
    """Get current user's role"""
    role = await get_user_role(user.email)
    return {
        "email": user.email,
        "role": role.value,
        "is_admin": role in [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        "is_super_admin": role == UserRole.SUPER_ADMIN
    }
