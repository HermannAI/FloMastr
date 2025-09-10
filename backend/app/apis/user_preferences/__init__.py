from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncpg
from app.auth import AuthorizedUser
from app.libs.models import UserPreferences, UserPreferencesCreate, UserPreferencesUpdate
from app.libs.db_connection import get_db_connection

router = APIRouter()

@router.post("/user-preferences", response_model=UserPreferences)
async def create_user_preferences(
    prefs: UserPreferencesCreate,
    user: AuthorizedUser = Depends()
) -> UserPreferences:
    """Create or update user preferences"""
    conn = await get_db_connection()
    try:
        # Use UPSERT to handle both create and update
        result = await conn.fetchrow("""
            INSERT INTO user_preferences (user_id, tenant_id, preferences)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, tenant_id)
            DO UPDATE SET 
                preferences = $3,
                updated_at = NOW()
            RETURNING id, user_id, tenant_id, preferences, created_at, updated_at
        """, 
        prefs.user_id, prefs.tenant_id, prefs.preferences
        )
        
        return UserPreferences(**dict(result))
    finally:
        await conn.close()

@router.get("/user-preferences/{user_id}", response_model=List[UserPreferences])
async def get_user_preferences(
    user_id: str,
    tenant_id: Optional[str] = None,
    user: AuthorizedUser = Depends()
) -> List[UserPreferences]:
    """Get user preferences, optionally filtered by tenant"""
    conn = await get_db_connection()
    try:
        if tenant_id:
            results = await conn.fetch("""
                SELECT id, user_id, tenant_id, preferences, created_at, updated_at
                FROM user_preferences
                WHERE user_id = $1 AND tenant_id = $2
            """, user_id, tenant_id)
        else:
            results = await conn.fetch("""
                SELECT id, user_id, tenant_id, preferences, created_at, updated_at
                FROM user_preferences
                WHERE user_id = $1
            """, user_id)
        
        return [UserPreferences(**dict(row)) for row in results]
    finally:
        await conn.close()

@router.put("/user-preferences/{user_id}", response_model=UserPreferences)
async def update_user_preferences(
    user_id: str,
    tenant_id: Optional[str],
    prefs_update: UserPreferencesUpdate,
    user: AuthorizedUser = Depends()
) -> UserPreferences:
    """Update user preferences"""
    conn = await get_db_connection()
    try:
        # Build the WHERE clause based on whether tenant_id is provided
        if tenant_id:
            where_clause = "user_id = $1 AND tenant_id = $2"
            params = [user_id, tenant_id, prefs_update.preferences]
        else:
            where_clause = "user_id = $1 AND tenant_id IS NULL"
            params = [user_id, prefs_update.preferences]
        
        result = await conn.fetchrow(f"""
            UPDATE user_preferences 
            SET preferences = ${len(params)}, updated_at = NOW()
            WHERE {where_clause}
            RETURNING id, user_id, tenant_id, preferences, created_at, updated_at
        """, *params)
        
        if not result:
            raise HTTPException(status_code=404, detail="User preferences not found")
        
        return UserPreferences(**dict(result))
    finally:
        await conn.close()

@router.delete("/user-preferences/{user_id}")
async def delete_user_preferences(
    user_id: str,
    tenant_id: Optional[str] = None,
    user: AuthorizedUser = Depends()
):
    """Delete user preferences"""
    conn = await get_db_connection()
    try:
        if tenant_id:
            result = await conn.execute("""
                DELETE FROM user_preferences 
                WHERE user_id = $1 AND tenant_id = $2
            """, user_id, tenant_id)
        else:
            result = await conn.execute("""
                DELETE FROM user_preferences 
                WHERE user_id = $1 AND tenant_id IS NULL
            """, user_id)
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="User preferences not found")
        
        return {"message": "User preferences deleted successfully"}
    finally:
        await conn.close()

@router.get("/user-preferences/{user_id}/setting/{setting_key}")
async def get_user_setting(
    user_id: str,
    setting_key: str,
    tenant_id: Optional[str] = None,
    default_value: Optional[str] = None,
    user: AuthorizedUser = Depends()
) -> Dict[str, Any]:
    """Get a specific setting from user preferences"""
    conn = await get_db_connection()
    try:
        if tenant_id:
            result = await conn.fetchval("""
                SELECT preferences->>$3
                FROM user_preferences
                WHERE user_id = $1 AND tenant_id = $2
            """, user_id, tenant_id, setting_key)
        else:
            result = await conn.fetchval("""
                SELECT preferences->>$2
                FROM user_preferences
                WHERE user_id = $1 AND tenant_id IS NULL
            """, user_id, setting_key)
        
        return {
            "key": setting_key,
            "value": result if result is not None else default_value,
            "user_id": user_id,
            "tenant_id": tenant_id
        }
    finally:
        await conn.close()

@router.put("/user-preferences/{user_id}/setting/{setting_key}")
async def update_user_setting(
    user_id: str,
    setting_key: str,
    setting_value: Dict[str, Any],
    tenant_id: Optional[str] = None,
    user: AuthorizedUser = Depends()
) -> Dict[str, Any]:
    """Update a specific setting in user preferences"""
    conn = await get_db_connection()
    try:
        # First, ensure user preferences exist
        if tenant_id:
            await conn.execute("""
                INSERT INTO user_preferences (user_id, tenant_id, preferences)
                VALUES ($1, $2, '{}')
                ON CONFLICT (user_id, tenant_id) DO NOTHING
            """, user_id, tenant_id)
            
            # Update the specific setting
            result = await conn.fetchval("""
                UPDATE user_preferences 
                SET preferences = jsonb_set(preferences, $3, $4, true),
                    updated_at = NOW()
                WHERE user_id = $1 AND tenant_id = $2
                RETURNING preferences->>$5
            """, user_id, tenant_id, [setting_key], f'"{setting_value["value"]}"', setting_key)
        else:
            await conn.execute("""
                INSERT INTO user_preferences (user_id, tenant_id, preferences)
                VALUES ($1, NULL, '{}')
                ON CONFLICT (user_id, tenant_id) DO NOTHING
            """, user_id)
            
            result = await conn.fetchval("""
                UPDATE user_preferences 
                SET preferences = jsonb_set(preferences, $2, $3, true),
                    updated_at = NOW()
                WHERE user_id = $1 AND tenant_id IS NULL
                RETURNING preferences->>$4
            """, user_id, [setting_key], f'"{setting_value["value"]}"', setting_key)
        
        return {
            "key": setting_key,
            "value": result,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "updated": True
        }
    finally:
        await conn.close()
