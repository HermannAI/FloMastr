
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.auth import AuthorizedUser
from app.libs.tenant_auth import TenantAuthorizedUser, TenantUserDep
import requests
import databutton as db

router = APIRouter()

class WorkflowInstallationRequest(BaseModel):
    master_workflow_id: str

class WorkflowInstallationResponse(BaseModel):
    success: bool
    tenant_workflow_id: Optional[str] = None
    message: str
    iframe_url: Optional[str] = None

@router.post("/install-workflow")
async def install_workflow(
    request: WorkflowInstallationRequest, 
    tenant_user: TenantAuthorizedUser = TenantUserDep
) -> WorkflowInstallationResponse:
    """
    Install a workflow from master n8n repository to tenant n8n instance
    
    1. Fetch workflow JSON from master repository using N8N_MASTER_API_KEY
    2. Install workflow to tenant n8n instance using N8N_API_KEY
    3. Return new workflow ID for iframe construction
    """
    
    try:
        # Get API keys from secrets
        n8n_master_api_key = db.secrets.get("N8N_MASTER_API_KEY")
        n8n_api_key = db.secrets.get("N8N_API_KEY")
        
        if not n8n_master_api_key or not n8n_api_key:
            raise HTTPException(
                status_code=500,
                detail="N8N API keys not configured"
            )
        
        # Step 1: Fetch workflow from master repository
        master_url = f"https://master.n8n.flomastr.com/api/v1/workflows/{request.master_workflow_id}"
        master_headers = {
            "X-N8N-API-KEY": n8n_master_api_key,
            "Content-Type": "application/json"
        }
        
        print(f"Fetching workflow from master: {master_url}")
        master_response = requests.get(master_url, headers=master_headers)
        
        if master_response.status_code != 200:
            print(f"Failed to fetch from master: {master_response.status_code} - {master_response.text}")
            raise HTTPException(
                status_code=404,
                detail=f"Workflow {request.master_workflow_id} not found in master repository"
            )
        
        workflow_data = master_response.json()
        print(f"Successfully fetched workflow: {workflow_data.get('name', 'Unnamed')}")
        
        # Step 2: Prepare workflow for installation (remove ID so n8n creates a new one)
        installation_data = workflow_data.copy()
        if 'id' in installation_data:
            del installation_data['id']  # Remove ID so n8n creates a new one
        
        # Step 3: Install workflow to tenant n8n instance
        tenant_url = f"https://{tenant_user.tenant_slug}.n8n.flomastr.com/api/v1/workflows"
        tenant_headers = {
            "X-N8N-API-KEY": n8n_api_key,
            "Content-Type": "application/json"
        }
        
        print(f"Installing workflow to tenant: {tenant_url}")
        tenant_response = requests.post(tenant_url, headers=tenant_headers, json=installation_data)
        
        if tenant_response.status_code not in [200, 201]:
            print(f"Failed to install to tenant: {tenant_response.status_code} - {tenant_response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to install workflow to tenant {tenant_user.tenant_slug}"
            )
        
        tenant_workflow = tenant_response.json()
        tenant_workflow_id = tenant_workflow.get('id')
        
        if not tenant_workflow_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to get workflow ID from tenant installation"
            )
        
        print(f"Successfully installed workflow with ID: {tenant_workflow_id}")
        
        # Step 4: Construct iframe URL
        iframe_url = f"https://{tenant_user.tenant_slug}.n8n.flomastr.com/workflow-setup/{tenant_workflow_id}"
        
        return WorkflowInstallationResponse(
            success=True,
            tenant_workflow_id=tenant_workflow_id,
            message=f"Workflow successfully installed to {tenant_user.tenant_slug}",
            iframe_url=iframe_url
        )
        
    except requests.RequestException as e:
        print(f"Network error during workflow installation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error during installation: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error during workflow installation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to install workflow: {str(e)}"
        )
