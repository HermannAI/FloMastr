import {
  AddPasteData,
  AddPasteRequest,
  BodyConvertFileToMd,
  BodyUploadLogo,
  BrandingUpdateRequest,
  CheckHealthData,
  CheckSuperAdminData,
  ConvertFileToMdData,
  ConvertUrlRequest,
  ConvertUrlToMarkdownData,
  CreateHitlTaskData,
  CreateTenantData,
  CreateUserRoleData,
  CreateWebchatSessionData,
  DebugAuthStatusData,
  DebugJwtTokenData,
  DeleteTenantData,
  EmbedKnowledgeData,
  EmbedRequest,
  GenerateAnswerData,
  GetBrandingSettingsData,
  GetContextEnvelopeData,
  GetCurrentUserRoleData,
  GetCurrentUserStatusData,
  GetHitlTaskDetailData,
  GetHitlTasksData,
  GetHitlTasksLegacyData,
  GetKnowledgeIndexData,
  GetPlatformManifestData,
  GetPostmanTokenData,
  GetPreflightCheckData,
  GetTenantBySlugData,
  GetTenantLifecycleStatusData,
  GetTenantProfileData,
  GetWebchatSessionData,
  GetWorkflowTemplatesData,
  HardDeleteTenantData,
  HealthCheckData,
  HitlTaskCreate,
  IngestMessageData,
  InstallWorkflowData,
  KnowledgeHealthData,
  ListTenantsData,
  ListUsersData,
  MessageIngestRequest,
  PrepareContextData,
  PrepareContextPayload,
  ProvisionTenantData,
  ReactivateTenantData,
  ResetBrandingSettingsData,
  ResolveHitlTaskData,
  ResolveTaskRequest,
  ResolveTenantByEmailData,
  ResolveTenantData,
  RestoreTenantData,
  ServeFaviconData,
  SoftDeleteTenantData,
  SuspendTenantData,
  SynthesisInput,
  SynthesizeData,
  TenantCreate,
  TenantLifecycleRequest,
  TenantPolicies,
  TenantProfileRequest,
  TenantProvisionRequest,
  TenantResolutionRequest,
  TenantUpdate,
  UpdateBrandingSettingsData,
  UpdateTenantData,
  UpdateTenantPoliciesData,
  UpdateTenantProfileData,
  UploadLogoData,
  UpsertKnowledgeIndexData,
  UpsertKnowledgeRequest,
  UserRoleCreate,
  WebChatSessionCreate,
  WorkflowInstallationRequest,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Dedicated synthesis endpoint that bypasses reverse proxy routing issues. Generates coherent, natural-language answers based on provided context and user query. Uses OpenAI GPT-4 to synthesize answers using only the provided context.
   * @tags dbtn/module:tools
   * @name synthesize
   * @summary Synthesize
   * @request POST:/routes/tools/synthesis
   * @secure
   */
  export namespace synthesize {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SynthesisInput;
    export type RequestHeaders = {};
    export type ResponseBody = SynthesizeData;
  }

  /**
   * @description Generates a coherent, natural-language answer based on provided context and user query. Uses OpenAI GPT-4 to synthesize answers using only the provided context.
   * @tags dbtn/module:tools
   * @name generate_answer
   * @summary Generate Answer
   * @request POST:/routes/tools/generate/answer
   * @secure
   */
  export namespace generate_answer {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SynthesisInput;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateAnswerData;
  }

  /**
   * @description Combines an array of knowledge chunks into a single, cohesive context string. Each chunk is separated by a delimiter for clear delineation.
   * @tags dbtn/module:tools
   * @name prepare_context
   * @summary Prepare Context
   * @request POST:/routes/tools/prepare/context
   * @secure
   */
  export namespace prepare_context {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PrepareContextPayload;
    export type RequestHeaders = {};
    export type ResponseBody = PrepareContextData;
  }

  /**
   * @description Accepts a file upload, extracts text, and returns it as markdown.
   * @tags dbtn/module:tools
   * @name convert_file_to_md
   * @summary Convert File To Md
   * @request POST:/routes/tools/convert/file-to-md
   * @secure
   */
  export namespace convert_file_to_md {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyConvertFileToMd;
    export type RequestHeaders = {};
    export type ResponseBody = ConvertFileToMdData;
  }

  /**
   * @description Convert URL to markdown
   * @tags dbtn/module:tools
   * @name convert_url_to_markdown
   * @summary Convert Url To Markdown
   * @request POST:/routes/tools/convert/url-to-md
   * @secure
   */
  export namespace convert_url_to_markdown {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ConvertUrlRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ConvertUrlToMarkdownData;
  }

  /**
   * @description Generate embeddings for knowledge content
   * @tags dbtn/module:tools
   * @name embed_knowledge
   * @summary Embed Knowledge
   * @request POST:/routes/tools/embed/knowledge
   * @secure
   */
  export namespace embed_knowledge {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = EmbedRequest;
    export type RequestHeaders = {};
    export type ResponseBody = EmbedKnowledgeData;
  }

  /**
   * @description Get list of workflow templates from master n8n repository
   * @tags dbtn/module:workflow_templates, dbtn/hasAuth
   * @name get_workflow_templates
   * @summary Get Workflow Templates
   * @request GET:/routes/workflow-templates
   */
  export namespace get_workflow_templates {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Search
       * Search workflows by name or description
       */
      search?: string | null;
      /**
       * Tags
       * Filter by tags (comma-separated)
       */
      tags?: string | null;
      /**
       * Sort
       * Sort by: name, tags
       * @default "name"
       */
      sort?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWorkflowTemplatesData;
  }

  /**
   * @description Debug endpoint to inspect JWT token and email parsing
   * @tags dbtn/module:debug_auth, dbtn/hasAuth
   * @name debug_jwt_token
   * @summary Debug Jwt Token
   * @request GET:/routes/debug/jwt
   */
  export namespace debug_jwt_token {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DebugJwtTokenData;
  }

  /**
   * @description Debug endpoint to check auth configuration
   * @tags dbtn/module:debug_auth, dbtn/hasAuth
   * @name debug_auth_status
   * @summary Debug Auth Status
   * @request GET:/routes/debug/auth-status
   */
  export namespace debug_auth_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DebugAuthStatusData;
  }

  /**
   * @description Public preflight check to verify required secrets for deployment - no authentication required.
   * @tags dbtn/module:public_platform
   * @name get_preflight_check
   * @summary Get Preflight Check
   * @request GET:/routes/api/v1/platform/preflight
   */
  export namespace get_preflight_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPreflightCheckData;
  }

  /**
   * @description Get the current user's status including super admin privileges. This endpoint uses the centralized is_super_admin function to determine if the authenticated user has super admin privileges. Returns: UserStatusResponse: Contains is_super_admin flag and user information
   * @tags dbtn/module:user_status, dbtn/hasAuth
   * @name get_current_user_status
   * @summary Get Current User Status
   * @request GET:/routes/api/v1/users/me/status
   */
  export namespace get_current_user_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentUserStatusData;
  }

  /**
   * @description Install a workflow from master n8n repository to tenant n8n instance 1. Fetch workflow JSON from master repository using N8N_MASTER_API_KEY 2. Install workflow to tenant n8n instance using N8N_API_KEY 3. Return new workflow ID for iframe construction
   * @tags dbtn/module:workflow_installation, dbtn/hasAuth
   * @name install_workflow
   * @summary Install Workflow
   * @request POST:/routes/install-workflow
   */
  export namespace install_workflow {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WorkflowInstallationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = InstallWorkflowData;
  }

  /**
   * @description Get conversation context envelope for a contact. Returns comprehensive context including contact info, conversation history, and routing information. Uses caching for performance. Either contact_id OR whatsapp must be provided.
   * @tags dbtn/module:context, dbtn/hasAuth
   * @name get_context_envelope
   * @summary Get Context Envelope
   * @request GET:/routes/envelope
   */
  export namespace get_context_envelope {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Tenant Id
       * Tenant identifier
       */
      tenant_id: string;
      /**
       * Contact Id
       * Contact UUID
       */
      contact_id?: string | null;
      /**
       * Whatsapp
       * WhatsApp number in E.164 format
       */
      whatsapp?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetContextEnvelopeData;
  }

  /**
   * @description Add paste content and forward to tenant's n8n webhook for ingestion. This endpoint: 1. Receives title and content from the frontend 2. Uses the authenticated user's tenant context 3. Forwards the data to the tenant's n8n webhook using server-to-server authentication 4. Returns success/error response
   * @tags dbtn/module:context, dbtn/hasAuth
   * @name add_paste
   * @summary Add Paste
   * @request POST:/routes/add-paste
   */
  export namespace add_paste {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AddPasteRequest;
    export type RequestHeaders = {};
    export type ResponseBody = AddPasteData;
  }

  /**
   * @description Get full JWT token for Postman testing (temporary endpoint)
   * @tags dbtn/module:postman_token, dbtn/hasAuth
   * @name get_postman_token
   * @summary Get Postman Token
   * @request GET:/routes/postman-token
   */
  export namespace get_postman_token {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPostmanTokenData;
  }

  /**
   * @description Receives and processes incoming WhatsApp messages from n8n backend
   * @tags dbtn/module:conversations
   * @name ingest_message
   * @summary Ingest WhatsApp Message
   * @request POST:/routes/api/v1/conversations/ingest
   * @secure
   */
  export namespace ingest_message {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = MessageIngestRequest;
    export type RequestHeaders = {};
    export type ResponseBody = IngestMessageData;
  }

  /**
   * @description Simple health check for the conversations API
   * @tags dbtn/module:conversations
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/api/v1/conversations/health
   */
  export namespace health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckData;
  }

  /**
   * @description Get the platform manifest containing app version, bundles, feature flags, and policies.
   * @tags dbtn/module:platform_apis, dbtn/hasAuth
   * @name get_platform_manifest
   * @summary Get Platform Manifest
   * @request GET:/routes/manifest
   */
  export namespace get_platform_manifest {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPlatformManifestData;
  }

  /**
   * @description Health check for knowledge service
   * @tags dbtn/module:knowledge, dbtn/hasAuth
   * @name knowledge_health
   * @summary Knowledge Health
   * @request GET:/routes/health
   */
  export namespace knowledge_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = KnowledgeHealthData;
  }

  /**
   * @description Get knowledge index for a tenant
   * @tags dbtn/module:knowledge, dbtn/hasAuth
   * @name get_knowledge_index
   * @summary Get Knowledge Index
   * @request GET:/routes/{tenant_slug}/index
   */
  export namespace get_knowledge_index {
    export type RequestParams = {
      tenantSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetKnowledgeIndexData;
  }

  /**
   * @description Upsert knowledge entry for a tenant
   * @tags dbtn/module:knowledge, dbtn/hasAuth
   * @name upsert_knowledge_index
   * @summary Upsert Knowledge Index
   * @request POST:/routes/{tenant_slug}/index
   */
  export namespace upsert_knowledge_index {
    export type RequestParams = {
      tenantSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UpsertKnowledgeRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpsertKnowledgeIndexData;
  }

  /**
   * @description Get complete tenant profile including branding for the authenticated user's tenant
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name get_tenant_profile
   * @summary Get Tenant Profile
   * @request GET:/routes/tenant-profile
   */
  export namespace get_tenant_profile {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTenantProfileData;
  }

  /**
   * @description Update complete tenant profile including branding for the authenticated user's tenant
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name update_tenant_profile
   * @summary Update Tenant Profile
   * @request PUT:/routes/tenant-profile
   */
  export namespace update_tenant_profile {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantProfileRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateTenantProfileData;
  }

  /**
   * @description Get branding settings for the authenticated user's tenant
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name get_branding_settings
   * @summary Get Branding Settings
   * @request GET:/routes/branding
   */
  export namespace get_branding_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetBrandingSettingsData;
  }

  /**
   * @description Update branding settings for the authenticated user's tenant
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name update_branding_settings
   * @summary Update Branding Settings
   * @request PUT:/routes/branding
   */
  export namespace update_branding_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BrandingUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateBrandingSettingsData;
  }

  /**
   * @description Upload SVG logo for the authenticated user's tenant
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name upload_logo
   * @summary Upload Logo
   * @request POST:/routes/branding/upload-logo
   */
  export namespace upload_logo {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadLogo;
    export type RequestHeaders = {};
    export type ResponseBody = UploadLogoData;
  }

  /**
   * @description Reset branding settings to defaults for the authenticated user's tenant
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name reset_branding_settings
   * @summary Reset Branding Settings
   * @request DELETE:/routes/branding/reset
   */
  export namespace reset_branding_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResetBrandingSettingsData;
  }

  /**
   * @description Legacy endpoint for HITL tasks
   * @tags dbtn/module:hitl_tasks
   * @name get_hitl_tasks_legacy
   * @summary Get Hitl Tasks Legacy
   * @request GET:/routes/tasks
   */
  export namespace get_hitl_tasks_legacy {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHitlTasksLegacyData;
  }

  /**
   * @description Retrieves active HITL tasks for the authenticated tenant, sorted by creation date.
   * @tags dbtn/module:hitl_tasks
   * @name get_hitl_tasks
   * @summary Get Active HITL Tasks
   * @request GET:/routes/api/v1/tasks
   */
  export namespace get_hitl_tasks {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHitlTasksData;
  }

  /**
   * @description Creates a new Human-in-the-Loop task. Validates that the task tenant_id matches the authenticated user's tenant.
   * @tags dbtn/module:hitl_tasks
   * @name create_hitl_task
   * @summary Create Hitl Task
   * @request POST:/routes/api/v1/tasks
   */
  export namespace create_hitl_task {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = HitlTaskCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateHitlTaskData;
  }

  /**
   * @description Retrieves detailed information for a specific HITL task by task_id.
   * @tags dbtn/module:hitl_tasks
   * @name get_hitl_task_detail
   * @summary Get HITL Task Details
   * @request GET:/routes/api/v1/tasks/{task_id}
   */
  export namespace get_hitl_task_detail {
    export type RequestParams = {
      /** Task Id */
      taskId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetHitlTaskDetailData;
  }

  /**
   * @description Resolve a HITL task with approve, rework, or reject action
   * @tags dbtn/module:hitl_tasks
   * @name resolve_hitl_task
   * @summary Resolve HITL Task
   * @request POST:/routes/api/v1/tasks/{task_id}/resolve
   */
  export namespace resolve_hitl_task {
    export type RequestParams = {
      /** Task Id */
      taskId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = ResolveTaskRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ResolveHitlTaskData;
  }

  /**
   * @description Suspend a tenant - changes status to 'suspended' but preserves all data. This is a reversible operation.
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name suspend_tenant
   * @summary Suspend Tenant
   * @request POST:/routes/suspend
   */
  export namespace suspend_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantLifecycleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SuspendTenantData;
  }

  /**
   * @description Reactivate a suspended tenant - changes status back to 'active'.
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name reactivate_tenant
   * @summary Reactivate Tenant
   * @request POST:/routes/reactivate
   */
  export namespace reactivate_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantLifecycleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ReactivateTenantData;
  }

  /**
   * @description Soft delete a tenant - sets deleted_at timestamp but preserves all data. This is a reversible operation that hides the tenant from normal listings.
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name soft_delete_tenant
   * @summary Soft Delete Tenant
   * @request POST:/routes/soft-delete
   */
  export namespace soft_delete_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantLifecycleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SoftDeleteTenantData;
  }

  /**
   * @description Restore a soft-deleted tenant - clears deleted_at timestamp.
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name restore_tenant
   * @summary Restore Tenant
   * @request POST:/routes/restore
   */
  export namespace restore_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantLifecycleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RestoreTenantData;
  }

  /**
   * @description Hard delete a tenant - permanently removes tenant and ALL related data. This is an IRREVERSIBLE operation that cascades to all related tables.
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name hard_delete_tenant
   * @summary Hard Delete Tenant
   * @request POST:/routes/hard-delete
   */
  export namespace hard_delete_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantLifecycleRequest;
    export type RequestHeaders = {};
    export type ResponseBody = HardDeleteTenantData;
  }

  /**
   * @description Get the current lifecycle status of a tenant.
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name get_tenant_lifecycle_status
   * @summary Get Tenant Lifecycle Status
   * @request GET:/routes/status/{tenant_id}
   */
  export namespace get_tenant_lifecycle_status {
    export type RequestParams = {
      /** Tenant Id */
      tenantId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTenantLifecycleStatusData;
  }

  /**
   * @description Resolve tenant by user email address. This endpoint is unprotected to allow tenant resolution before authentication.
   * @tags dbtn/module:tenant_resolution
   * @name resolve_tenant
   * @summary Resolve Tenant
   * @request GET:/routes/resolve-tenant
   */
  export namespace resolve_tenant {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Email */
      email: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ResolveTenantData;
  }

  /**
   * @description Resolve tenant by user email address (POST version). This endpoint is unprotected to allow tenant resolution before authentication.
   * @tags dbtn/module:tenant_resolution
   * @name resolve_tenant_by_email
   * @summary Resolve Tenant By Email
   * @request POST:/routes/resolve-tenant
   */
  export namespace resolve_tenant_by_email {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantResolutionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ResolveTenantByEmailData;
  }

  /**
   * @description List all tenants (admin only in production)
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name list_tenants
   * @summary List Tenants
   * @request GET:/routes/tenants
   */
  export namespace list_tenants {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Skip
       * @default 0
       */
      skip?: number;
      /**
       * Limit
       * @default 100
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTenantsData;
  }

  /**
   * @description Create a new tenant
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name create_tenant
   * @summary Create Tenant
   * @request POST:/routes/tenants
   */
  export namespace create_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTenantData;
  }

  /**
   * @description Get tenant by slug
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name get_tenant_by_slug
   * @summary Get Tenant By Slug
   * @request GET:/routes/tenants/{tenant_slug}
   */
  export namespace get_tenant_by_slug {
    export type RequestParams = {
      /** Tenant Slug */
      tenantSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTenantBySlugData;
  }

  /**
   * @description Update tenant information
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name update_tenant
   * @summary Update Tenant
   * @request PUT:/routes/tenants/{tenant_slug}
   */
  export namespace update_tenant {
    export type RequestParams = {
      /** Tenant Slug */
      tenantSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TenantUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateTenantData;
  }

  /**
   * @description Delete tenant (super admin only)
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name delete_tenant
   * @summary Delete Tenant
   * @request DELETE:/routes/tenants/{tenant_slug}
   */
  export namespace delete_tenant {
    export type RequestParams = {
      /** Tenant Slug */
      tenantSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTenantData;
  }

  /**
   * @description Update tenant policy flags (Super-Admin only)
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name update_tenant_policies
   * @summary Update Tenant Policies
   * @request PUT:/routes/tenants/{tenant_slug}/policies
   */
  export namespace update_tenant_policies {
    export type RequestParams = {
      /** Tenant Slug */
      tenantSlug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TenantPolicies;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateTenantPoliciesData;
  }

  /**
   * @description Check if current user is super admin (debugging endpoint)
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name check_super_admin
   * @summary Check Super Admin
   * @request GET:/routes/check-super-admin
   */
  export namespace check_super_admin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckSuperAdminData;
  }

  /**
   * @description Create a new webchat session
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name create_webchat_session
   * @summary Create Webchat Session
   * @request POST:/routes/webchat/sessions
   */
  export namespace create_webchat_session {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = WebChatSessionCreate;
    export type RequestHeaders = {
      /** Host */
      host?: string | null;
    };
    export type ResponseBody = CreateWebchatSessionData;
  }

  /**
   * @description Get webchat session by key
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name get_webchat_session
   * @summary Get Webchat Session
   * @request GET:/routes/webchat/sessions/{session_key}
   */
  export namespace get_webchat_session {
    export type RequestParams = {
      /** Session Key */
      sessionKey: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetWebchatSessionData;
  }

  /**
   * @description List all users and their roles (Super-Admin only)
   * @tags dbtn/module:user_management, dbtn/hasAuth
   * @name list_users
   * @summary List Users
   * @request GET:/routes/users
   */
  export namespace list_users {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListUsersData;
  }

  /**
   * @description Create a new user role assignment (Super-Admin only)
   * @tags dbtn/module:user_management, dbtn/hasAuth
   * @name create_user_role
   * @summary Create User Role
   * @request POST:/routes/users
   */
  export namespace create_user_role {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UserRoleCreate;
    export type RequestHeaders = {};
    export type ResponseBody = CreateUserRoleData;
  }

  /**
   * @description Get current user's role
   * @tags dbtn/module:user_management, dbtn/hasAuth
   * @name get_current_user_role
   * @summary Get Current User Role
   * @request GET:/routes/current-user-role
   */
  export namespace get_current_user_role {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCurrentUserRoleData;
  }

  /**
   * @description Provision a new tenant with its first owner user. This endpoint performs three atomic operations: 1. Creates a new tenant in the tenants table 2. Creates a new user in the user_roles table 3. Links the user to the tenant via tenant_memberships table with 'owner' role All operations are performed in a single database transaction to ensure data integrity. Requires Super-Admin privileges.
   * @tags dbtn/module:admin_tenant_provision, dbtn/hasAuth
   * @name provision_tenant
   * @summary Provision Tenant
   * @request POST:/routes/api/v1/admin/tenants/provision
   */
  export namespace provision_tenant {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TenantProvisionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ProvisionTenantData;
  }

  /**
   * @description Serve the FloMastr favicon to override framework routing. This endpoint resolves the issue where /favicon.ico was being caught by the framework's catch-all routing and returning HTML instead of an icon. Browsers check /favicon.ico first, so this ensures they get a proper response.
   * @tags dbtn/module:favicon, dbtn/hasAuth
   * @name serve_favicon
   * @summary Serve Favicon
   * @request GET:/routes/favicon.ico
   */
  export namespace serve_favicon {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ServeFaviconData;
  }
}
