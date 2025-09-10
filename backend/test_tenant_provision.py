#!/usr/bin/env python3
"""
Test script for tenant provisioning endpoint
"""

import requests
import json
import os

def test_tenant_provision():
    # Set the database URL
    os.environ["DATABASE_URL"] = "postgresql://doadmin:AVNS_60oX1gbkyUjUxv2y63s@db-postgresql-blr1-flomastr-do-user-24629085-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
    
    url = "http://localhost:8000/routes/api/v1/admin/tenants/provision"
    
    payload = {
        "tenant_slug": "test-company",
        "owner_email": "admin@test.com", 
        "tenant_name": "Test Company",
        "n8n_url": "https://test.n8n.flomastr.com"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("🚀 Testing tenant provisioning endpoint...")
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print("Making request...")
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            data = response.json()
            print(f"Tenant created: {data}")
        else:
            print(f"❌ ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Raw error: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_tenant_provision()
