#!/usr/bin/env python3
"""
Test script to verify tenant provisioning authentication
"""
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_tenant_provision():
    """Test tenant provisioning with authentication"""
    base_url = "http://localhost:8000"

    # Test data
    test_data = {
        "tenant_slug": "test-tenant-123",
        "owner_email": "test@example.com",
        "tenant_name": "Test Tenant",
        "n8n_url": "https://test.n8n.flomastr.com/"
    }

    print("🧪 Testing Tenant Provisioning Authentication")
    print("=" * 50)
    print(f"Endpoint: {base_url}/api/v1/admin/tenants/provision")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    print()

    # First test without authentication
    print("1. Testing without authentication...")
    try:
        response = requests.post(
            f"{base_url}/api/v1/admin/tenants/provision",
            json=test_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")

    print()

    # Test with a mock Bearer token
    print("2. Testing with mock Bearer token...")
    try:
        headers = {"Authorization": "Bearer mock-jwt-token"}
        response = requests.post(
            f"{base_url}/api/v1/admin/tenants/provision",
            json=test_data,
            headers=headers,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")

    print()

    # Test the health endpoint
    print("3. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_tenant_provision()
