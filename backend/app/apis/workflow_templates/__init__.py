


from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import databutton as db

router = APIRouter()

class WorkflowResponse(BaseModel):
    id: str
    name: str
    icon_url: str
    description: str
    tags: List[str]
    requires: List[str]

class WorkflowsListResponse(BaseModel):
    workflows: List[WorkflowResponse]
    total: int

@router.get("/workflow-templates")
async def get_workflow_templates(
    search: Optional[str] = Query(None, description="Search workflows by name or description"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    sort: Optional[str] = Query("name", description="Sort by: name, tags")
) -> WorkflowsListResponse:
    """
    Get list of workflow templates from master n8n repository
    """
    
    # Get master n8n API key from secrets
    n8n_master_api_key = db.secrets.get("N8N_MASTER_API_KEY")
    if not n8n_master_api_key:
        raise HTTPException(status_code=500, detail="N8N master API key not configured")
    
    try:
        # Make API call to master n8n repository
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://test.n8n.flomastr.com/api/v1/workflows?active=true",
                headers={
                    "X-N8N-API-KEY": n8n_master_api_key,
                    "Accept": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                print(f"Master n8n API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=502, 
                    detail=f"Failed to fetch workflow templates from master repository: {response.status_code}"
                )
            
            n8n_workflows = response.json()
            
        # Transform n8n workflows to our format
        workflows = []
        
        for workflow in n8n_workflows.get('data', []):
            # Map n8n workflow data to our WorkflowResponse model
            workflow_id = str(workflow.get('id', ''))
            name = workflow.get('name', 'Untitled Workflow')
            
            # Generate description from workflow name and nodes if available
            description = f"Automated workflow: {name}"
            if 'nodes' in workflow:
                node_count = len(workflow.get('nodes', []))
                description = f"Automated workflow with {node_count} steps"
            
            # Generate tags based on workflow content
            tags = []
            if workflow.get('active'):
                tags.append('active')
            if 'webhook' in name.lower():
                tags.append('webhook')
            if 'chat' in name.lower() or 'bot' in name.lower() or 'support' in name.lower():
                tags.append('chatbot')
            if 'email' in name.lower():
                tags.append('email')
            if 'crm' in name.lower() or 'lead' in name.lower():
                tags.append('crm')
            if 'health' in name.lower() or 'patient' in name.lower() or 'triage' in name.lower():
                tags.append('healthcare')
            if 'booking' in name.lower() or 'appointment' in name.lower():
                tags.append('booking')
            if 'finance' in name.lower() or 'invoice' in name.lower():
                tags.append('finance')
            if 'automation' in name.lower():
                tags.append('automation')
            
            # Generate requires list based on workflow nodes
            requires = []
            if 'nodes' in workflow:
                node_types = [node.get('type', '') for node in workflow.get('nodes', [])]
                if 'n8n-nodes-base.openAi' in node_types:
                    requires.append('OpenAI')
                if 'n8n-nodes-base.webhook' in node_types:
                    requires.append('Webhook')
                if 'n8n-nodes-base.emailSend' in node_types:
                    requires.append('Email')
                if 'n8n-nodes-base.httpRequest' in node_types:
                    requires.append('HTTP')
                if any('twilio' in nt.lower() for nt in node_types):
                    requires.append('Twilio')
                if any('zendesk' in nt.lower() for nt in node_types):
                    requires.append('Zendesk')
                if any('calendar' in nt.lower() for nt in node_types):
                    requires.append('Calendar')
                if any('sms' in nt.lower() for nt in node_types):
                    requires.append('SMS')
            
            # Generate icon URL based on workflow type
            icon_url = "https://cdn.flomastr.com/icons/workflow.svg"
            if 'chat' in name.lower() or 'bot' in name.lower() or 'support' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/chat.svg"
            elif 'email' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/email.svg"
            elif 'webhook' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/webhook.svg"
            elif 'crm' in name.lower() or 'lead' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/crm.svg"
            elif 'health' in name.lower() or 'patient' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/health.svg"
            elif 'booking' in name.lower() or 'appointment' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/calendar.svg"
            elif 'finance' in name.lower() or 'invoice' in name.lower():
                icon_url = "https://cdn.flomastr.com/icons/finance.svg"
            
            workflows.append(WorkflowResponse(
                id=workflow_id,
                name=name,
                icon_url=icon_url,
                description=description,
                tags=tags,
                requires=requires
            ))
        
        # Apply filtering
        filtered_workflows = workflows
        
        if search:
            search_lower = search.lower()
            filtered_workflows = [
                w for w in filtered_workflows 
                if search_lower in w.name.lower() or search_lower in w.description.lower()
            ]
        
        if tags:
            # Handle tags parameter - ensure it's a string before splitting
            if isinstance(tags, str):
                filter_tags = [tag.strip().lower() for tag in tags.split(',')]
            else:
                filter_tags = [str(tag).strip().lower() for tag in tags] if isinstance(tags, list) else []
            
            filtered_workflows = [
                w for w in filtered_workflows 
                if any(tag.lower() in [t.lower() for t in w.tags] for tag in filter_tags)
            ]
        
        # Apply sorting
        if sort == "name":
            filtered_workflows.sort(key=lambda w: w.name.lower())
        elif sort == "tags":
            filtered_workflows.sort(key=lambda w: len(w.tags), reverse=True)
        
        return WorkflowsListResponse(
            workflows=filtered_workflows,
            total=len(filtered_workflows)
        )
        
    except httpx.RequestError as e:
        print(f"Network error connecting to master n8n: {str(e)}")
        raise HTTPException(
            status_code=502, 
            detail="Failed to connect to master workflow repository"
        ) from e
    except Exception as e:
        print(f"Unexpected error fetching workflow templates: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error while fetching workflow templates"
        ) from e
