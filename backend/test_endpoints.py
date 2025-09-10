#!/usr/bin/env python3
import requests
import json

def test_endpoints():
    base_url = "http://localhost:8000"

    print("🧪 Testing FloMastr API Endpoints")
    print("=" * 50)

    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")

    print()

    # Test admin test endpoint
    try:
        response = requests.get(f"{base_url}/routes/api/v1/admin/test", timeout=5)
        print(f"✅ Admin test endpoint: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Admin test endpoint error: {e}")

    print()

    # Test tenant provisioning endpoint (without auth for now)
    try:
        test_data = {
            "tenant_slug": "test-tenant",
            "owner_email": "test@example.com",
            "tenant_name": "Test Tenant"
        }
        response = requests.post(
            f"{base_url}/routes/api/v1/admin/tenants/provision",
            json=test_data,
            timeout=5
        )
        print(f"✅ Tenant provision endpoint: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Tenant provision endpoint error: {e}")

if __name__ == "__main__":
    test_endpoints()
