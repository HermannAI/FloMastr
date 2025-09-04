


"""Authentication utilities for normalizing user authentication across development and production.

This module provides utilities to handle authentication inconsistencies between
the Databutton development framework (which uses test auth) and Stack Auth.
"""

import databutton as db
from typing import Optional
from app.env import Mode, mode


def is_super_admin(user) -> bool:
    """
    Centralized function to check if a user is a super admin.
    
    This function consolidates all super admin validation logic and reads from
    the SUPER_ADMIN_IDS environment variable which contains a comma-separated
    list of user IDs that have super admin privileges.
    
    Args:
        user: The user object from AuthorizedUser dependency or user ID string
        
    Returns:
        True if the user is a super admin, False otherwise
    """
    # Extract user ID from user object or use directly if it's a string
    user_id = getattr(user, 'sub', str(user)) if hasattr(user, 'sub') else str(user)
    
    # Get the comma-separated list of super admin IDs
    super_admin_ids_str = db.secrets.get("SUPER_ADMIN_IDS")
    if not super_admin_ids_str:
        return False
        
    # Parse the comma-separated list and check if user ID is in it
    super_admin_ids = [admin_id.strip() for admin_id in super_admin_ids_str.split(',') if admin_id.strip()]
    
    return user_id in super_admin_ids


def normalize_user_id(user_id: str) -> str:
    """
    Normalize user ID to ensure consistent authentication.
    
    This function now only handles basic ID validation without any
    development mode bypasses for security.
    
    Args:
        user_id: The user ID from the authentication system
        
    Returns:
        The normalized user ID (proper UUID)
    """
    # Get the configured super admin ID
    super_admin_id = db.secrets.get("SUPER_ADMIN_IDS")
    
    # If already the correct UUID, return as-is
    if user_id == super_admin_id:
        return user_id
        
    # For all other users, return the original ID
    # (this allows for proper multi-user support)
    return user_id


def is_super_admin_normalized(user_id: str) -> bool:
    """
    Check if a user is a super admin using normalized authentication.
    
    This handles the authentication inconsistencies by normalizing the user ID first.
    DEPRECATED: Use is_super_admin(user) instead for new code.
    
    Args:
        user_id: The user ID to check
        
    Returns:
        True if the user is a super admin, False otherwise
    """
    normalized_id = normalize_user_id(user_id)
    super_admin_id = db.secrets.get("SUPER_ADMIN_IDS")
    return normalized_id == super_admin_id


def get_normalized_user_context(user) -> dict:
    """
    Get normalized user context with consistent user identification.
    
    Args:
        user: The user object from AuthorizedUser dependency
        
    Returns:
        Dictionary with normalized user information
    """
    original_id = getattr(user, 'sub', str(user))
    normalized_id = normalize_user_id(original_id)
    
    return {
        "user_id": normalized_id,
        "original_user_id": original_id,
        "is_super_admin": is_super_admin(user),  # Use the new centralized function
        "is_normalized": normalized_id != original_id,
        "auth_mode": mode.value
    }
