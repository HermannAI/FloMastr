import {
  AddPasteData,
  AddPasteError,
  AddPasteRequest,
  BodyConvertFileToMd,
  BodyUploadLogo,
  BrandingUpdateRequest,
  CheckHealthData,
  CheckSuperAdminData,
  ConvertFileToMdData,
  ConvertFileToMdError,
  ConvertUrlRequest,
  ConvertUrlToMarkdownData,
  ConvertUrlToMarkdownError,
  CreateHitlTaskData,
  CreateHitlTaskError,
  CreateTenantData,
  CreateTenantError,
  CreateUserRoleData,
  CreateUserRoleError,
  CreateWebchatSessionData,
  CreateWebchatSessionError,
  DebugAuthStatusData,
  DebugJwtTokenData,
  DeleteTenantData,
  DeleteTenantError,
  DeleteTenantParams,
  EmbedKnowledgeData,
  EmbedKnowledgeError,
  EmbedRequest,
  GenerateAnswerData,
  GenerateAnswerError,
  GetBrandingSettingsData,
  GetContextEnvelopeData,
  GetContextEnvelopeError,
  GetContextEnvelopeParams,
  GetCurrentUserRoleData,
  GetCurrentUserStatusData,
  GetHitlTaskDetailData,
  GetHitlTaskDetailError,
  GetHitlTaskDetailParams,
  GetHitlTasksData,
  GetHitlTasksLegacyData,
  GetKnowledgeIndexData,
  GetKnowledgeIndexParams,
  GetPlatformManifestData,
  GetPostmanTokenData,
  GetPreflightCheckData,
  GetTenantBySlugData,
  GetTenantBySlugError,
  GetTenantBySlugParams,
  GetTenantLifecycleStatusData,
  GetTenantLifecycleStatusError,
  GetTenantLifecycleStatusParams,
  GetTenantProfileData,
  GetWebchatSessionData,
  GetWebchatSessionError,
  GetWebchatSessionParams,
  GetWorkflowTemplatesData,
  GetWorkflowTemplatesError,
  GetWorkflowTemplatesParams,
  HardDeleteTenantData,
  HardDeleteTenantError,
  HealthCheckData,
  HitlTaskCreate,
  IngestMessageData,
  IngestMessageError,
  InstallWorkflowData,
  InstallWorkflowError,
  KnowledgeHealthData,
  ListTenantsData,
  ListTenantsError,
  ListTenantsParams,
  ListUsersData,
  MessageIngestRequest,
  PrepareContextData,
  PrepareContextError,
  PrepareContextPayload,
  ProvisionTenantData,
  ProvisionTenantError,
  ReactivateTenantData,
  ReactivateTenantError,
  ResetBrandingSettingsData,
  ResolveHitlTaskData,
  ResolveHitlTaskError,
  ResolveHitlTaskParams,
  ResolveTaskRequest,
  ResolveTenantByEmailData,
  ResolveTenantByEmailError,
  ResolveTenantData,
  ResolveTenantError,
  ResolveTenantParams,
  RestoreTenantData,
  RestoreTenantError,
  ServeFaviconData,
  SoftDeleteTenantData,
  SoftDeleteTenantError,
  SuspendTenantData,
  SuspendTenantError,
  SynthesisInput,
  SynthesizeData,
  SynthesizeError,
  TenantCreate,
  TenantLifecycleRequest,
  TenantPolicies,
  TenantProfileRequest,
  TenantProvisionRequest,
  TenantResolutionRequest,
  TenantUpdate,
  UpdateBrandingSettingsData,
  UpdateBrandingSettingsError,
  UpdateTenantData,
  UpdateTenantError,
  UpdateTenantParams,
  UpdateTenantPoliciesData,
  UpdateTenantPoliciesError,
  UpdateTenantPoliciesParams,
  UpdateTenantProfileData,
  UpdateTenantProfileError,
  UploadLogoData,
  UploadLogoError,
  UpsertKnowledgeIndexData,
  UpsertKnowledgeIndexError,
  UpsertKnowledgeIndexParams,
  UpsertKnowledgeRequest,
  UserRoleCreate,
  WebChatSessionCreate,
  WorkflowInstallationRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Dedicated synthesis endpoint that bypasses reverse proxy routing issues. Generates coherent, natural-language answers based on provided context and user query. Uses OpenAI GPT-4 to synthesize answers using only the provided context.
   *
   * @tags dbtn/module:tools
   * @name synthesize
   * @summary Synthesize
   * @request POST:/routes/tools/synthesis
   * @secure
   */
  synthesize = (data: SynthesisInput, params: RequestParams = {}) =>
    this.request<SynthesizeData, SynthesizeError>({
      path: `/routes/tools/synthesis`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generates a coherent, natural-language answer based on provided context and user query. Uses OpenAI GPT-4 to synthesize answers using only the provided context.
   *
   * @tags dbtn/module:tools
   * @name generate_answer
   * @summary Generate Answer
   * @request POST:/routes/tools/generate/answer
   * @secure
   */
  generate_answer = (data: SynthesisInput, params: RequestParams = {}) =>
    this.request<GenerateAnswerData, GenerateAnswerError>({
      path: `/routes/tools/generate/answer`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Combines an array of knowledge chunks into a single, cohesive context string. Each chunk is separated by a delimiter for clear delineation.
   *
   * @tags dbtn/module:tools
   * @name prepare_context
   * @summary Prepare Context
   * @request POST:/routes/tools/prepare/context
   * @secure
   */
  prepare_context = (data: PrepareContextPayload, params: RequestParams = {}) =>
    this.request<PrepareContextData, PrepareContextError>({
      path: `/routes/tools/prepare/context`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Accepts a file upload, extracts text, and returns it as markdown.
   *
   * @tags dbtn/module:tools
   * @name convert_file_to_md
   * @summary Convert File To Md
   * @request POST:/routes/tools/convert/file-to-md
   * @secure
   */
  convert_file_to_md = (data: BodyConvertFileToMd, params: RequestParams = {}) =>
    this.request<ConvertFileToMdData, ConvertFileToMdError>({
      path: `/routes/tools/convert/file-to-md`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Convert URL to markdown
   *
   * @tags dbtn/module:tools
   * @name convert_url_to_markdown
   * @summary Convert Url To Markdown
   * @request POST:/routes/tools/convert/url-to-md
   * @secure
   */
  convert_url_to_markdown = (data: ConvertUrlRequest, params: RequestParams = {}) =>
    this.request<ConvertUrlToMarkdownData, ConvertUrlToMarkdownError>({
      path: `/routes/tools/convert/url-to-md`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Generate embeddings for knowledge content
   *
   * @tags dbtn/module:tools
   * @name embed_knowledge
   * @summary Embed Knowledge
   * @request POST:/routes/tools/embed/knowledge
   * @secure
   */
  embed_knowledge = (data: EmbedRequest, params: RequestParams = {}) =>
    this.request<EmbedKnowledgeData, EmbedKnowledgeError>({
      path: `/routes/tools/embed/knowledge`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get list of workflow templates from master n8n repository
   *
   * @tags dbtn/module:workflow_templates, dbtn/hasAuth
   * @name get_workflow_templates
   * @summary Get Workflow Templates
   * @request GET:/routes/workflow-templates
   */
  get_workflow_templates = (query: GetWorkflowTemplatesParams, params: RequestParams = {}) =>
    this.request<GetWorkflowTemplatesData, GetWorkflowTemplatesError>({
      path: `/routes/workflow-templates`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Debug endpoint to inspect JWT token and email parsing
   *
   * @tags dbtn/module:debug_auth, dbtn/hasAuth
   * @name debug_jwt_token
   * @summary Debug Jwt Token
   * @request GET:/routes/debug/jwt
   */
  debug_jwt_token = (params: RequestParams = {}) =>
    this.request<DebugJwtTokenData, any>({
      path: `/routes/debug/jwt`,
      method: "GET",
      ...params,
    });

  /**
   * @description Debug endpoint to check auth configuration
   *
   * @tags dbtn/module:debug_auth, dbtn/hasAuth
   * @name debug_auth_status
   * @summary Debug Auth Status
   * @request GET:/routes/debug/auth-status
   */
  debug_auth_status = (params: RequestParams = {}) =>
    this.request<DebugAuthStatusData, any>({
      path: `/routes/debug/auth-status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Public preflight check to verify required secrets for deployment - no authentication required.
   *
   * @tags dbtn/module:public_platform
   * @name get_preflight_check
   * @summary Get Preflight Check
   * @request GET:/routes/api/v1/platform/preflight
   */
  get_preflight_check = (params: RequestParams = {}) =>
    this.request<GetPreflightCheckData, any>({
      path: `/routes/api/v1/platform/preflight`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the current user's status including super admin privileges. This endpoint uses the centralized is_super_admin function to determine if the authenticated user has super admin privileges. Returns: UserStatusResponse: Contains is_super_admin flag and user information
   *
   * @tags dbtn/module:user_status, dbtn/hasAuth
   * @name get_current_user_status
   * @summary Get Current User Status
   * @request GET:/routes/api/v1/users/me/status
   */
  get_current_user_status = (params: RequestParams = {}) =>
    this.request<GetCurrentUserStatusData, any>({
      path: `/routes/api/v1/users/me/status`,
      method: "GET",
      ...params,
    });

  /**
   * @description Install a workflow from master n8n repository to tenant n8n instance 1. Fetch workflow JSON from master repository using N8N_MASTER_API_KEY 2. Install workflow to tenant n8n instance using N8N_API_KEY 3. Return new workflow ID for iframe construction
   *
   * @tags dbtn/module:workflow_installation, dbtn/hasAuth
   * @name install_workflow
   * @summary Install Workflow
   * @request POST:/routes/install-workflow
   */
  install_workflow = (data: WorkflowInstallationRequest, params: RequestParams = {}) =>
    this.request<InstallWorkflowData, InstallWorkflowError>({
      path: `/routes/install-workflow`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get conversation context envelope for a contact. Returns comprehensive context including contact info, conversation history, and routing information. Uses caching for performance. Either contact_id OR whatsapp must be provided.
   *
   * @tags dbtn/module:context, dbtn/hasAuth
   * @name get_context_envelope
   * @summary Get Context Envelope
   * @request GET:/routes/envelope
   */
  get_context_envelope = (query: GetContextEnvelopeParams, params: RequestParams = {}) =>
    this.request<GetContextEnvelopeData, GetContextEnvelopeError>({
      path: `/routes/envelope`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Add paste content and forward to tenant's n8n webhook for ingestion. This endpoint: 1. Receives title and content from the frontend 2. Uses the authenticated user's tenant context 3. Forwards the data to the tenant's n8n webhook using server-to-server authentication 4. Returns success/error response
   *
   * @tags dbtn/module:context, dbtn/hasAuth
   * @name add_paste
   * @summary Add Paste
   * @request POST:/routes/add-paste
   */
  add_paste = (data: AddPasteRequest, params: RequestParams = {}) =>
    this.request<AddPasteData, AddPasteError>({
      path: `/routes/add-paste`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get full JWT token for Postman testing (temporary endpoint)
   *
   * @tags dbtn/module:postman_token, dbtn/hasAuth
   * @name get_postman_token
   * @summary Get Postman Token
   * @request GET:/routes/postman-token
   */
  get_postman_token = (params: RequestParams = {}) =>
    this.request<GetPostmanTokenData, any>({
      path: `/routes/postman-token`,
      method: "GET",
      ...params,
    });

  /**
   * @description Receives and processes incoming WhatsApp messages from n8n backend
   *
   * @tags dbtn/module:conversations
   * @name ingest_message
   * @summary Ingest WhatsApp Message
   * @request POST:/routes/api/v1/conversations/ingest
   * @secure
   */
  ingest_message = (data: MessageIngestRequest, params: RequestParams = {}) =>
    this.request<IngestMessageData, IngestMessageError>({
      path: `/routes/api/v1/conversations/ingest`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Simple health check for the conversations API
   *
   * @tags dbtn/module:conversations
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/api/v1/conversations/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<HealthCheckData, any>({
      path: `/routes/api/v1/conversations/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get the platform manifest containing app version, bundles, feature flags, and policies.
   *
   * @tags dbtn/module:platform_apis, dbtn/hasAuth
   * @name get_platform_manifest
   * @summary Get Platform Manifest
   * @request GET:/routes/manifest
   */
  get_platform_manifest = (params: RequestParams = {}) =>
    this.request<GetPlatformManifestData, any>({
      path: `/routes/manifest`,
      method: "GET",
      ...params,
    });

  /**
   * @description Health check for knowledge service
   *
   * @tags dbtn/module:knowledge, dbtn/hasAuth
   * @name knowledge_health
   * @summary Knowledge Health
   * @request GET:/routes/health
   */
  knowledge_health = (params: RequestParams = {}) =>
    this.request<KnowledgeHealthData, any>({
      path: `/routes/health`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get knowledge index for a tenant
   *
   * @tags dbtn/module:knowledge, dbtn/hasAuth
   * @name get_knowledge_index
   * @summary Get Knowledge Index
   * @request GET:/routes/{tenant_slug}/index
   */
  get_knowledge_index = ({ tenantSlug, ...query }: GetKnowledgeIndexParams, params: RequestParams = {}) =>
    this.request<GetKnowledgeIndexData, any>({
      path: `/routes/${tenantSlug}/index`,
      method: "GET",
      ...params,
    });

  /**
   * @description Upsert knowledge entry for a tenant
   *
   * @tags dbtn/module:knowledge, dbtn/hasAuth
   * @name upsert_knowledge_index
   * @summary Upsert Knowledge Index
   * @request POST:/routes/{tenant_slug}/index
   */
  upsert_knowledge_index = (
    { tenantSlug, ...query }: UpsertKnowledgeIndexParams,
    data: UpsertKnowledgeRequest,
    params: RequestParams = {},
  ) =>
    this.request<UpsertKnowledgeIndexData, UpsertKnowledgeIndexError>({
      path: `/routes/${tenantSlug}/index`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get complete tenant profile including branding for the authenticated user's tenant
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name get_tenant_profile
   * @summary Get Tenant Profile
   * @request GET:/routes/tenant-profile
   */
  get_tenant_profile = (params: RequestParams = {}) =>
    this.request<GetTenantProfileData, any>({
      path: `/routes/tenant-profile`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update complete tenant profile including branding for the authenticated user's tenant
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name update_tenant_profile
   * @summary Update Tenant Profile
   * @request PUT:/routes/tenant-profile
   */
  update_tenant_profile = (data: TenantProfileRequest, params: RequestParams = {}) =>
    this.request<UpdateTenantProfileData, UpdateTenantProfileError>({
      path: `/routes/tenant-profile`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get branding settings for the authenticated user's tenant
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name get_branding_settings
   * @summary Get Branding Settings
   * @request GET:/routes/branding
   */
  get_branding_settings = (params: RequestParams = {}) =>
    this.request<GetBrandingSettingsData, any>({
      path: `/routes/branding`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update branding settings for the authenticated user's tenant
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name update_branding_settings
   * @summary Update Branding Settings
   * @request PUT:/routes/branding
   */
  update_branding_settings = (data: BrandingUpdateRequest, params: RequestParams = {}) =>
    this.request<UpdateBrandingSettingsData, UpdateBrandingSettingsError>({
      path: `/routes/branding`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Upload SVG logo for the authenticated user's tenant
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name upload_logo
   * @summary Upload Logo
   * @request POST:/routes/branding/upload-logo
   */
  upload_logo = (data: BodyUploadLogo, params: RequestParams = {}) =>
    this.request<UploadLogoData, UploadLogoError>({
      path: `/routes/branding/upload-logo`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      ...params,
    });

  /**
   * @description Reset branding settings to defaults for the authenticated user's tenant
   *
   * @tags dbtn/module:branding, dbtn/hasAuth
   * @name reset_branding_settings
   * @summary Reset Branding Settings
   * @request DELETE:/routes/branding/reset
   */
  reset_branding_settings = (params: RequestParams = {}) =>
    this.request<ResetBrandingSettingsData, any>({
      path: `/routes/branding/reset`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Legacy endpoint for HITL tasks
   *
   * @tags dbtn/module:hitl_tasks
   * @name get_hitl_tasks_legacy
   * @summary Get Hitl Tasks Legacy
   * @request GET:/routes/tasks
   */
  get_hitl_tasks_legacy = (params: RequestParams = {}) =>
    this.request<GetHitlTasksLegacyData, any>({
      path: `/routes/tasks`,
      method: "GET",
      ...params,
    });

  /**
   * @description Retrieves active HITL tasks for the authenticated tenant, sorted by creation date.
   *
   * @tags dbtn/module:hitl_tasks
   * @name get_hitl_tasks
   * @summary Get Active HITL Tasks
   * @request GET:/routes/api/v1/tasks
   */
  get_hitl_tasks = (params: RequestParams = {}) =>
    this.request<GetHitlTasksData, any>({
      path: `/routes/api/v1/tasks`,
      method: "GET",
      ...params,
    });

  /**
   * @description Creates a new Human-in-the-Loop task. Validates that the task tenant_id matches the authenticated user's tenant.
   *
   * @tags dbtn/module:hitl_tasks
   * @name create_hitl_task
   * @summary Create Hitl Task
   * @request POST:/routes/api/v1/tasks
   */
  create_hitl_task = (data: HitlTaskCreate, params: RequestParams = {}) =>
    this.request<CreateHitlTaskData, CreateHitlTaskError>({
      path: `/routes/api/v1/tasks`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Retrieves detailed information for a specific HITL task by task_id.
   *
   * @tags dbtn/module:hitl_tasks
   * @name get_hitl_task_detail
   * @summary Get HITL Task Details
   * @request GET:/routes/api/v1/tasks/{task_id}
   */
  get_hitl_task_detail = ({ taskId, ...query }: GetHitlTaskDetailParams, params: RequestParams = {}) =>
    this.request<GetHitlTaskDetailData, GetHitlTaskDetailError>({
      path: `/routes/api/v1/tasks/${taskId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Resolve a HITL task with approve, rework, or reject action
   *
   * @tags dbtn/module:hitl_tasks
   * @name resolve_hitl_task
   * @summary Resolve HITL Task
   * @request POST:/routes/api/v1/tasks/{task_id}/resolve
   */
  resolve_hitl_task = (
    { taskId, ...query }: ResolveHitlTaskParams,
    data: ResolveTaskRequest,
    params: RequestParams = {},
  ) =>
    this.request<ResolveHitlTaskData, ResolveHitlTaskError>({
      path: `/routes/api/v1/tasks/${taskId}/resolve`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Suspend a tenant - changes status to 'suspended' but preserves all data. This is a reversible operation.
   *
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name suspend_tenant
   * @summary Suspend Tenant
   * @request POST:/routes/suspend
   */
  suspend_tenant = (data: TenantLifecycleRequest, params: RequestParams = {}) =>
    this.request<SuspendTenantData, SuspendTenantError>({
      path: `/routes/suspend`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Reactivate a suspended tenant - changes status back to 'active'.
   *
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name reactivate_tenant
   * @summary Reactivate Tenant
   * @request POST:/routes/reactivate
   */
  reactivate_tenant = (data: TenantLifecycleRequest, params: RequestParams = {}) =>
    this.request<ReactivateTenantData, ReactivateTenantError>({
      path: `/routes/reactivate`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Soft delete a tenant - sets deleted_at timestamp but preserves all data. This is a reversible operation that hides the tenant from normal listings.
   *
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name soft_delete_tenant
   * @summary Soft Delete Tenant
   * @request POST:/routes/soft-delete
   */
  soft_delete_tenant = (data: TenantLifecycleRequest, params: RequestParams = {}) =>
    this.request<SoftDeleteTenantData, SoftDeleteTenantError>({
      path: `/routes/soft-delete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Restore a soft-deleted tenant - clears deleted_at timestamp.
   *
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name restore_tenant
   * @summary Restore Tenant
   * @request POST:/routes/restore
   */
  restore_tenant = (data: TenantLifecycleRequest, params: RequestParams = {}) =>
    this.request<RestoreTenantData, RestoreTenantError>({
      path: `/routes/restore`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Hard delete a tenant - permanently removes tenant and ALL related data. This is an IRREVERSIBLE operation that cascades to all related tables.
   *
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name hard_delete_tenant
   * @summary Hard Delete Tenant
   * @request POST:/routes/hard-delete
   */
  hard_delete_tenant = (data: TenantLifecycleRequest, params: RequestParams = {}) =>
    this.request<HardDeleteTenantData, HardDeleteTenantError>({
      path: `/routes/hard-delete`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get the current lifecycle status of a tenant.
   *
   * @tags dbtn/module:tenant_lifecycle, dbtn/hasAuth
   * @name get_tenant_lifecycle_status
   * @summary Get Tenant Lifecycle Status
   * @request GET:/routes/status/{tenant_id}
   */
  get_tenant_lifecycle_status = ({ tenantId, ...query }: GetTenantLifecycleStatusParams, params: RequestParams = {}) =>
    this.request<GetTenantLifecycleStatusData, GetTenantLifecycleStatusError>({
      path: `/routes/status/${tenantId}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Resolve tenant by user email address. This endpoint is unprotected to allow tenant resolution before authentication.
   *
   * @tags dbtn/module:tenant_resolution
   * @name resolve_tenant
   * @summary Resolve Tenant
   * @request GET:/routes/resolve-tenant
   */
  resolve_tenant = (query: ResolveTenantParams, params: RequestParams = {}) =>
    this.request<ResolveTenantData, ResolveTenantError>({
      path: `/routes/resolve-tenant`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Resolve tenant by user email address (POST version). This endpoint is unprotected to allow tenant resolution before authentication.
   *
   * @tags dbtn/module:tenant_resolution
   * @name resolve_tenant_by_email
   * @summary Resolve Tenant By Email
   * @request POST:/routes/resolve-tenant
   */
  resolve_tenant_by_email = (data: TenantResolutionRequest, params: RequestParams = {}) =>
    this.request<ResolveTenantByEmailData, ResolveTenantByEmailError>({
      path: `/routes/resolve-tenant`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description List all tenants (admin only in production)
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name list_tenants
   * @summary List Tenants
   * @request GET:/routes/tenants
   */
  list_tenants = (query: ListTenantsParams, params: RequestParams = {}) =>
    this.request<ListTenantsData, ListTenantsError>({
      path: `/routes/tenants`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * @description Create a new tenant
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name create_tenant
   * @summary Create Tenant
   * @request POST:/routes/tenants
   */
  create_tenant = (data: TenantCreate, params: RequestParams = {}) =>
    this.request<CreateTenantData, CreateTenantError>({
      path: `/routes/tenants`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get tenant by slug
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name get_tenant_by_slug
   * @summary Get Tenant By Slug
   * @request GET:/routes/tenants/{tenant_slug}
   */
  get_tenant_by_slug = ({ tenantSlug, ...query }: GetTenantBySlugParams, params: RequestParams = {}) =>
    this.request<GetTenantBySlugData, GetTenantBySlugError>({
      path: `/routes/tenants/${tenantSlug}`,
      method: "GET",
      ...params,
    });

  /**
   * @description Update tenant information
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name update_tenant
   * @summary Update Tenant
   * @request PUT:/routes/tenants/{tenant_slug}
   */
  update_tenant = ({ tenantSlug, ...query }: UpdateTenantParams, data: TenantUpdate, params: RequestParams = {}) =>
    this.request<UpdateTenantData, UpdateTenantError>({
      path: `/routes/tenants/${tenantSlug}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Delete tenant (super admin only)
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name delete_tenant
   * @summary Delete Tenant
   * @request DELETE:/routes/tenants/{tenant_slug}
   */
  delete_tenant = ({ tenantSlug, ...query }: DeleteTenantParams, params: RequestParams = {}) =>
    this.request<DeleteTenantData, DeleteTenantError>({
      path: `/routes/tenants/${tenantSlug}`,
      method: "DELETE",
      ...params,
    });

  /**
   * @description Update tenant policy flags (Super-Admin only)
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name update_tenant_policies
   * @summary Update Tenant Policies
   * @request PUT:/routes/tenants/{tenant_slug}/policies
   */
  update_tenant_policies = (
    { tenantSlug, ...query }: UpdateTenantPoliciesParams,
    data: TenantPolicies,
    params: RequestParams = {},
  ) =>
    this.request<UpdateTenantPoliciesData, UpdateTenantPoliciesError>({
      path: `/routes/tenants/${tenantSlug}/policies`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Check if current user is super admin (debugging endpoint)
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name check_super_admin
   * @summary Check Super Admin
   * @request GET:/routes/check-super-admin
   */
  check_super_admin = (params: RequestParams = {}) =>
    this.request<CheckSuperAdminData, any>({
      path: `/routes/check-super-admin`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new webchat session
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name create_webchat_session
   * @summary Create Webchat Session
   * @request POST:/routes/webchat/sessions
   */
  create_webchat_session = (data: WebChatSessionCreate, params: RequestParams = {}) =>
    this.request<CreateWebchatSessionData, CreateWebchatSessionError>({
      path: `/routes/webchat/sessions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get webchat session by key
   *
   * @tags dbtn/module:tenants, dbtn/hasAuth
   * @name get_webchat_session
   * @summary Get Webchat Session
   * @request GET:/routes/webchat/sessions/{session_key}
   */
  get_webchat_session = ({ sessionKey, ...query }: GetWebchatSessionParams, params: RequestParams = {}) =>
    this.request<GetWebchatSessionData, GetWebchatSessionError>({
      path: `/routes/webchat/sessions/${sessionKey}`,
      method: "GET",
      ...params,
    });

  /**
   * @description List all users and their roles (Super-Admin only)
   *
   * @tags dbtn/module:user_management, dbtn/hasAuth
   * @name list_users
   * @summary List Users
   * @request GET:/routes/users
   */
  list_users = (params: RequestParams = {}) =>
    this.request<ListUsersData, any>({
      path: `/routes/users`,
      method: "GET",
      ...params,
    });

  /**
   * @description Create a new user role assignment (Super-Admin only)
   *
   * @tags dbtn/module:user_management, dbtn/hasAuth
   * @name create_user_role
   * @summary Create User Role
   * @request POST:/routes/users
   */
  create_user_role = (data: UserRoleCreate, params: RequestParams = {}) =>
    this.request<CreateUserRoleData, CreateUserRoleError>({
      path: `/routes/users`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Get current user's role
   *
   * @tags dbtn/module:user_management, dbtn/hasAuth
   * @name get_current_user_role
   * @summary Get Current User Role
   * @request GET:/routes/current-user-role
   */
  get_current_user_role = (params: RequestParams = {}) =>
    this.request<GetCurrentUserRoleData, any>({
      path: `/routes/current-user-role`,
      method: "GET",
      ...params,
    });

  /**
   * @description Provision a new tenant with its first owner user. This endpoint performs three atomic operations: 1. Creates a new tenant in the tenants table 2. Creates a new user in the user_roles table 3. Links the user to the tenant via tenant_memberships table with 'owner' role All operations are performed in a single database transaction to ensure data integrity. Requires Super-Admin privileges.
   *
   * @tags dbtn/module:admin_tenant_provision, dbtn/hasAuth
   * @name provision_tenant
   * @summary Provision Tenant
   * @request POST:/routes/api/v1/admin/tenants/provision
   */
  provision_tenant = (data: TenantProvisionRequest, params: RequestParams = {}) =>
    this.request<ProvisionTenantData, ProvisionTenantError>({
      path: `/routes/api/v1/admin/tenants/provision`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Serve the FloMastr favicon to override framework routing. This endpoint resolves the issue where /favicon.ico was being caught by the framework's catch-all routing and returning HTML instead of an icon. Browsers check /favicon.ico first, so this ensures they get a proper response.
   *
   * @tags dbtn/module:favicon, dbtn/hasAuth
   * @name serve_favicon
   * @summary Serve Favicon
   * @request GET:/routes/favicon.ico
   */
  serve_favicon = (params: RequestParams = {}) =>
    this.request<ServeFaviconData, any>({
      path: `/routes/favicon.ico`,
      method: "GET",
      ...params,
    });
}
