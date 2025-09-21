


from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime
import asyncpg

# Import centralized database connection
from app.libs.db_connection import get_db_connection

router = APIRouter()

def check_super_admin_access(request: Request) -> bool:
    """Check if request has super admin access (same pattern as main.py)"""
    import os
    
    # Get email from headers or query params
    email = (request.query_params.get('email') or 
            request.query_params.get('user_email') or
            request.headers.get('X-User-Email') or 
            request.headers.get('x-user-email') or
            request.headers.get('user-email') or 
            request.headers.get('email'))
    
    if not email:
        return False
    
    # Check against configured super admin emails
    super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS", "")
    super_admin_emails = [e.strip().lower() for e in super_admin_emails_str.split(",") if e.strip()]
    
    return email.lower().strip() in super_admin_emails

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
async def list_users(request: Request) -> List[UserRoleInfo]:
    """List all users and their roles (Super-Admin only)"""
    
    # Check super admin access using simple header-based method
    if not check_super_admin_access(request):
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    print(f"🔍 USER-MANAGEMENT: List users called by super admin")
    
    conn = await get_db_connection()
    try:
        # First check if user_roles table exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'user_roles'
            )
        """)
        
        if not table_exists:
            print(f"⚠️ USER-MANAGEMENT: user_roles table doesn't exist, creating sample data")
            # Return some sample data based on configured super admins
            import os
            super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS", "")
            sample_users = []
            
            for i, email in enumerate(super_admin_emails_str.split(",")):
                if email.strip():
                    sample_users.append(UserRoleInfo(
                        id=str(i + 1),
                        email=email.strip(),
                        role=UserRole.SUPER_ADMIN,
                        assigned_by="system",
                        assigned_at=datetime.now(),
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    ))
            
            print(f"✅ USER-MANAGEMENT: Returned {len(sample_users)} sample super admin users")
            return sample_users
        
        rows = await conn.fetch(
            """
            SELECT id, email, role, assigned_by, assigned_at, created_at, updated_at
            FROM user_roles
            ORDER BY created_at DESC
            """
        )
        
        users = [
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
        
        print(f"✅ USER-MANAGEMENT: Returned {len(users)} users from database")
        return users
        
    finally:
        await conn.close()

@router.post("/users", response_model=UserRoleInfo)
async def create_user_role(request: Request, user_data: UserRoleCreate) -> UserRoleInfo:
    """Create a new user role assignment (Super-Admin only)"""
    
    # Check super admin access using simple header-based method
    if not check_super_admin_access(request):
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    print(f"🔍 USER-MANAGEMENT: Create user role called for {user_data.email}")
    
    conn = await get_db_connection()
    try:
        # Check if user already exists
        existing = await conn.fetchrow(
            "SELECT id FROM user_roles WHERE email = $1",
            user_data.email
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="User role already exists")
        
        # Get assigner email from request headers
        assigner_email = request.headers.get("X-User-Email", "super-admin@system")
        
        # Insert new user role
        row = await conn.fetchrow(
            """
            INSERT INTO user_roles (email, role, assigned_by)
            VALUES ($1, $2, $3)
            RETURNING id, email, role, assigned_by, assigned_at, created_at, updated_at
            """,
            user_data.email,
            user_data.role.value,
            assigner_email
        )
        
        result = UserRoleInfo(
            id=str(row['id']),
            email=row['email'],
            role=UserRole(row['role']),
            assigned_by=row['assigned_by'],
            assigned_at=row['assigned_at'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
        
        print(f"✅ USER-MANAGEMENT: Created user role for {user_data.email}")
        return result
        
    finally:
        await conn.close()

@router.get("/me/role", response_model=dict)
async def get_current_user_role(request: Request) -> dict:
    """Get current user's role"""
    
    # Check super admin access using simple header-based method
    if not check_super_admin_access(request):
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Get user email from request headers
    user_email = request.headers.get("X-User-Email", "")
    if not user_email:
        raise HTTPException(status_code=400, detail="User email header required")
    
    print(f"🔍 USER-MANAGEMENT: Get current user role for {user_email}")
    
    role = await get_user_role(user_email)
    
    result = {
        "email": user_email,
        "role": role.value,
        "is_admin": role in [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        "is_super_admin": role == UserRole.SUPER_ADMIN
    }
    
    print(f"✅ USER-MANAGEMENT: Current user role: {result}")
    return result
