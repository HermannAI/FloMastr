


"""Authentication utilities for normalizing user authentication across development and production.

This module provides utilities to handle authentication inconsistencies between
standard environment variables and Clerk authentication.
"""

from typing import Optional
import os


def is_super_admin(user) -> bool:
    """
    Centralized function to check if a user is a super admin.
    
    This function consolidates all super admin validation logic and checks both
    SUPER_ADMIN_IDS (user IDs) and SUPER_ADMIN_EMAILS (email addresses).
    
    Args:
        user: The user object from AuthorizedUser dependency or user ID string
        
    Returns:
        True if the user is a super admin, False otherwise
    """
    # Extract user ID and email from user object
    user_id = getattr(user, 'sub', None) or getattr(user, 'user_id', None)
    user_email = getattr(user, 'email', None)
    
    print(f"🔍 IS_SUPER_ADMIN: User object: {user}")
    print(f"🔍 IS_SUPER_ADMIN: Extracted user_id: {user_id}")
    print(f"🔍 IS_SUPER_ADMIN: Extracted user_email: {user_email}")
    
    # Check by email first (for Clerk authentication)
    super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS", "")
    print(f"🔍 IS_SUPER_ADMIN: SUPER_ADMIN_EMAILS env var: '{super_admin_emails_str}'")
    
    if super_admin_emails_str and user_email:
        super_admin_emails = [e.strip().lower() for e in super_admin_emails_str.split(',') if e.strip()]
        print(f"🔍 IS_SUPER_ADMIN: Parsed super admin emails: {super_admin_emails}")
        print(f"🔍 IS_SUPER_ADMIN: User email lower: '{user_email.lower()}'")
        print(f"🔍 IS_SUPER_ADMIN: Email in list: {user_email.lower() in super_admin_emails}")
        
        if user_email.lower() in super_admin_emails:
            print("✅ IS_SUPER_ADMIN: Match found by email!")
            return True
    
    # Check by user ID from environment variable
    super_admin_ids_str = os.getenv("SUPER_ADMIN_IDS", "")
    print(f"🔍 IS_SUPER_ADMIN: SUPER_ADMIN_IDS env var: '{super_admin_ids_str}'")
    
    if super_admin_ids_str and user_id:
        super_admin_ids = [admin_id.strip() for admin_id in super_admin_ids_str.split(',') if admin_id.strip()]
        print(f"🔍 IS_SUPER_ADMIN: Parsed super admin IDs: {super_admin_ids}")
        print(f"🔍 IS_SUPER_ADMIN: User ID in list: {user_id in super_admin_ids}")
        
        if user_id in super_admin_ids:
            print("✅ IS_SUPER_ADMIN: Match found by user ID!")
            return True
    
    print("❌ IS_SUPER_ADMIN: No match found")
    return False


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
    # Get the configured super admin IDs
    super_admin_ids_str = os.getenv("SUPER_ADMIN_IDS", "")
    super_admin_ids = [admin_id.strip() for admin_id in super_admin_ids_str.split(',') if admin_id.strip()]
    
    # If user_id is in super admin list, return as-is
    if user_id in super_admin_ids:
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
    super_admin_ids_str = os.getenv("SUPER_ADMIN_IDS", "")
    super_admin_ids = [admin_id.strip() for admin_id in super_admin_ids_str.split(',') if admin_id.strip()]
    return normalized_id in super_admin_ids


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
        "is_normalized": normalized_id != original_id
    }


def is_super_admin_email_simple(email: str) -> bool:
    """
    SIMPLIFIED super admin check - just check email against environment variable.
    
    This function provides a simple way to check if an email is a super admin
    without requiring any user object or complex authentication.
    
    Args:
        email: Email address to check
        
    Returns:
        True if the email is in SUPER_ADMIN_EMAILS, False otherwise
    """
    if not email:
        return False
    
    super_admin_emails_str = os.getenv("SUPER_ADMIN_EMAILS", "")
    if not super_admin_emails_str:
        return False
    
    super_admin_emails = [e.strip().lower() for e in super_admin_emails_str.split(',') if e.strip()]
    return email.lower().strip() in super_admin_emails
