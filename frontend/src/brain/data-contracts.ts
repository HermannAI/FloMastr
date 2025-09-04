/**
 * AddPasteRequest
 * Add paste request model
 */
export interface AddPasteRequest {
  /**
   * Title
   * Title for the pasted content
   */
  title: string;
  /**
   * Content
   * Content to be pasted and ingested
   */
  content: string;
}

/**
 * AddPasteResponse
 * Add paste response model
 */
export interface AddPasteResponse {
  /** Status */
  status: string;
  /** Message */
  message: string;
  /** Tenant Slug */
  tenant_slug?: string | null;
}

/** AnswerResponse */
export interface AnswerResponse {
  /** Answer */
  answer: string;
}

/** Body_convert_file_to_md */
export interface BodyConvertFileToMd {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** Body_upload_logo */
export interface BodyUploadLogo {
  /**
   * File
   * @format binary
   */
  file: File;
}

/** BrandingResponse */
export interface BrandingResponse {
  /** Tenant Id */
  tenant_id: string;
  /** Logo Svg */
  logo_svg: string | null;
  /** Brand Primary */
  brand_primary: string;
}

/** BrandingUpdateRequest */
export interface BrandingUpdateRequest {
  /** Brand Primary */
  brand_primary?: string | null;
  /** Logo Svg */
  logo_svg?: string | null;
}

/** CompanySize */
export enum CompanySize {
  Value110 = "1-10",
  Value1150 = "11-50",
  Value51200 = "51-200",
  Value2011000 = "201-1000",
  Value1000 = "1000+",
}

/** ComponentBlock */
export interface ComponentBlock {
  /** Id */
  id: string;
  /** Type */
  type: string;
  /** Data */
  data: Record<string, any>;
}

/**
 * ContactInfo
 * Contact information model
 */
export interface ContactInfo {
  /** Id */
  id?: string | null;
  /** Name */
  name?: string | null;
  /** Phone */
  phone: string;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * ContextEnvelope
 * Context envelope response model
 */
export interface ContextEnvelope {
  /**
   * Partial
   * @default false
   */
  partial?: boolean;
  /** Errors */
  errors?: string[];
  /** Contact information model */
  contact: ContactInfo;
  /** Conversation history model */
  conversation_history: ConversationHistory;
  /** Routing information model */
  routing: RoutingInfo;
  /** Custom Data */
  custom_data?: Record<string, any>;
}

/** ContextResponse */
export interface ContextResponse {
  /** Context */
  context: string;
}

/**
 * ConversationHistory
 * Conversation history model
 */
export interface ConversationHistory {
  /** Recent Messages */
  recent_messages?: MessageInfo[];
  /**
   * Summary
   * @default ""
   */
  summary?: string;
}

/** ConvertFileResponse */
export interface ConvertFileResponse {
  /** Markdown */
  markdown: string;
}

/** ConvertResponse */
export interface ConvertResponse {
  /** Markdown */
  markdown: string;
  /** Title */
  title: string;
}

/** ConvertUrlRequest */
export interface ConvertUrlRequest {
  /**
   * Url
   * @format uri
   * @minLength 1
   * @maxLength 2083
   */
  url: string;
}

/** EmbedRequest */
export interface EmbedRequest {
  /** Texts */
  texts: string[];
}

/** EmbedResponse */
export interface EmbedResponse {
  /** Embeddings */
  embeddings: number[][];
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** HitlTask */
export interface HitlTask {
  /** Task Id */
  task_id: string;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Status */
  status: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Assigned To */
  assigned_to?: string | null;
}

/** HitlTaskCreate */
export interface HitlTaskCreate {
  /** Tenant Id */
  tenant_id: string;
  /** Title */
  title: string;
  /** Description */
  description?: string | null;
  /** Payload Components */
  payload_components?: Record<string, any> | null;
}

/** HitlTaskDetail */
export interface HitlTaskDetail {
  /** Task Id */
  task_id: string;
  /** Tenant Id */
  tenant_id: string;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Status */
  status: string;
  payload_components?: PayloadComponents | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Assigned To */
  assigned_to?: string | null;
}

/** Industry */
export enum Industry {
  Technology = "technology",
  Healthcare = "healthcare",
  Finance = "finance",
  Education = "education",
  Retail = "retail",
  Manufacturing = "manufacturing",
  RealEstate = "real_estate",
  Legal = "legal",
  Consulting = "consulting",
  NonProfit = "non_profit",
  Other = "other",
}

/** JWTDebugResponse */
export interface JWTDebugResponse {
  /** Raw Token */
  raw_token?: string | null;
  /** Token Header */
  token_header?: Record<string, any> | null;
  /** Token Payload */
  token_payload?: Record<string, any> | null;
  /** Authorized User Data */
  authorized_user_data?: Record<string, any> | null;
  /** Email In Jwt */
  email_in_jwt?: string | null;
  /** Email In User */
  email_in_user?: string | null;
  /** Debug Info */
  debug_info: Record<string, any>;
}

/** KnowledgeIndexResponse */
export interface KnowledgeIndexResponse {
  /** Entries */
  entries: Record<string, any>[];
  /** Total Count */
  total_count: number;
}

/**
 * MessageInfo
 * Message information model
 */
export interface MessageInfo {
  /** Ts */
  ts: string;
  /** Dir */
  dir: string;
  /** Text */
  text: string;
}

/** MessageIngestRequest */
export interface MessageIngestRequest {
  /**
   * Tenant Id
   * Tenant identifier
   */
  tenant_id: string;
  /**
   * Contact Number
   * WhatsApp contact number
   */
  contact_number: string;
  /**
   * Contact Name
   * Contact's display name
   */
  contact_name: string;
  /**
   * Message Content
   * The message content
   */
  message_content: string;
}

/** MessageIngestResponse */
export interface MessageIngestResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Contact Id */
  contact_id?: string | null;
  /** Message Id */
  message_id?: string | null;
  /** Thread Id */
  thread_id?: string | null;
  /**
   * Created Contact
   * @default false
   */
  created_contact?: boolean;
  /**
   * Created Thread
   * @default false
   */
  created_thread?: boolean;
}

/** PayloadComponents */
export interface PayloadComponents {
  /**
   * Version
   * @default "1.0"
   */
  version?: string;
  /** Blocks */
  blocks: ComponentBlock[];
}

/** PlatformManifestResponse */
export interface PlatformManifestResponse {
  /** App Version */
  app_version: string;
  /** Bundles */
  bundles: Record<string, any>;
  /** Feature Flags */
  feature_flags: Record<string, any>;
  /** Policies */
  policies: Record<string, any>;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/**
 * PreflightSecretsResponse
 * Public preflight response for deployment diagnosis - checks secrets without authentication
 */
export interface PreflightSecretsResponse {
  /** Stack Secret Server Key */
  stack_secret_server_key: string;
  /** Super Admin Ids */
  super_admin_ids: string;
  /** Database Connection */
  database_connection: string;
  /**
   * Timestamp
   * @format date-time
   */
  timestamp: string;
}

/** ResolveTaskRequest */
export interface ResolveTaskRequest {
  /** Action */
  action: string;
  /** Feedback */
  feedback?: string | null;
}

/** ResolveTaskResponse */
export interface ResolveTaskResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Task Id */
  task_id: string;
  /** New Status */
  new_status: string;
}

/**
 * RoutingInfo
 * Routing information model
 */
export interface RoutingInfo {
  /** Assigned Agent */
  assigned_agent?: string | null;
  /**
   * Sla Seconds
   * @default 900
   */
  sla_seconds?: number;
}

/** SynthesisInput */
export interface SynthesisInput {
  /** User's text query */
  query: string;
  /** Context to use for synthesis */
  context: string;
}

/** Tenant */
export interface Tenant {
  /** Id */
  id: number;
  /** Slug */
  slug: string;
  /** Name */
  name: string;
  /** N8N Url */
  n8n_url?: string | null;
  status: TenantStatus;
  /** Branding Settings */
  branding_settings?: Record<string, any>;
  /**
   * Confidence Threshold
   * @default 0.75
   */
  confidence_threshold?: string;
  /**
   * Hot Ttl Days
   * @default 30
   */
  hot_ttl_days?: number;
  /**
   * Inbox Scope
   * @default "databutton"
   */
  inbox_scope?: string;
  /**
   * Catalog Enabled
   * @default false
   */
  catalog_enabled?: boolean;
  /** Cold Db Ref */
  cold_db_ref?: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
  /** Deleted At */
  deleted_at?: string | null;
  /** Company Name */
  company_name?: string | null;
  /** Industry */
  industry?: string | null;
  /** Company Address */
  company_address?: string | null;
  /** Website Url */
  website_url?: string | null;
  /** Company Size */
  company_size?: string | null;
  /** Time Zone */
  time_zone?: string | null;
  /** Primary Contact Name */
  primary_contact_name?: string | null;
  /** Primary Contact Title */
  primary_contact_title?: string | null;
  /** Primary Contact Email */
  primary_contact_email?: string | null;
  /** Primary Contact Phone */
  primary_contact_phone?: string | null;
  /** Primary Contact Whatsapp */
  primary_contact_whatsapp?: string | null;
  /** Billing Contact Name */
  billing_contact_name?: string | null;
  /** Billing Contact Email */
  billing_contact_email?: string | null;
  /** Technical Contact Name */
  technical_contact_name?: string | null;
  /** Technical Contact Email */
  technical_contact_email?: string | null;
  /** Custom Domain */
  custom_domain?: string | null;
}

/** TenantCreate */
export interface TenantCreate {
  /** Slug */
  slug: string;
  /** Name */
  name: string;
  /** N8N Url */
  n8n_url?: string | null;
  /** @default "active" */
  status?: TenantStatus;
  /** Cold Db Ref */
  cold_db_ref?: string | null;
  /** Company Name */
  company_name?: string | null;
  /** Industry */
  industry?: string | null;
  /** Company Address */
  company_address?: string | null;
  /** Website Url */
  website_url?: string | null;
  /** Company Size */
  company_size?: string | null;
  /** Time Zone */
  time_zone?: string | null;
  /** Primary Contact Name */
  primary_contact_name?: string | null;
  /** Primary Contact Title */
  primary_contact_title?: string | null;
  /** Primary Contact Email */
  primary_contact_email?: string | null;
  /** Primary Contact Phone */
  primary_contact_phone?: string | null;
  /** Primary Contact Whatsapp */
  primary_contact_whatsapp?: string | null;
  /** Billing Contact Name */
  billing_contact_name?: string | null;
  /** Billing Contact Email */
  billing_contact_email?: string | null;
  /** Technical Contact Name */
  technical_contact_name?: string | null;
  /** Technical Contact Email */
  technical_contact_email?: string | null;
  /** Custom Domain */
  custom_domain?: string | null;
}

/** TenantLifecycleRequest */
export interface TenantLifecycleRequest {
  /** Tenant Id */
  tenant_id: number;
  /** Action */
  action: string;
  /** Reason */
  reason?: string | null;
}

/** TenantLifecycleResponse */
export interface TenantLifecycleResponse {
  /** Tenant Id */
  tenant_id: number;
  /** Action */
  action: string;
  /** Status */
  status: string;
  /** Message */
  message: string;
  /**
   * Timestamp
   * @format date-time
   */
  timestamp: string;
}

/**
 * TenantPolicies
 * Tenant-level policy configurations
 */
export interface TenantPolicies {
  /** Rate Limit Per Minute */
  rate_limit_per_minute?: number | null;
  /** Max Context Length */
  max_context_length?: number | null;
  /** Allowed File Types */
  allowed_file_types?: string[] | null;
  /** Max File Size Mb */
  max_file_size_mb?: number | null;
  /** Message Retention Days */
  message_retention_days?: number | null;
  /** Hot Ttl Days */
  hot_ttl_days?: number | null;
  /** Inbox Scope */
  inbox_scope?: string | null;
  /** Catalog Enabled */
  catalog_enabled?: boolean | null;
}

/**
 * TenantProfileRequest
 * Request model for updating tenant profile including branding
 */
export interface TenantProfileRequest {
  /** Brand Primary */
  brand_primary?: string | null;
  /** Logo Svg */
  logo_svg?: string | null;
  /** Company Name */
  company_name?: string | null;
  /** Industry */
  industry?: (Industry | string) | null;
  /** Company Address */
  company_address?: string | null;
  /** Website Url */
  website_url?: string | null;
  company_size?: CompanySize | null;
  /** Time Zone */
  time_zone?: string | null;
  /** Primary Contact Name */
  primary_contact_name?: string | null;
  /** Primary Contact Title */
  primary_contact_title?: string | null;
  /** Primary Contact Email */
  primary_contact_email?: string | null;
  /** Primary Contact Phone */
  primary_contact_phone?: string | null;
  /** Primary Contact Whatsapp */
  primary_contact_whatsapp?: string | null;
  /** Billing Contact Name */
  billing_contact_name?: string | null;
  /** Billing Contact Email */
  billing_contact_email?: string | null;
  /** Technical Contact Name */
  technical_contact_name?: string | null;
  /** Technical Contact Email */
  technical_contact_email?: string | null;
  /** Custom Domain */
  custom_domain?: string | null;
  /** Cold Db Ref */
  cold_db_ref?: string | null;
}

/**
 * TenantProfileResponse
 * Response model for tenant profile including branding
 */
export interface TenantProfileResponse {
  /** Tenant Id */
  tenant_id: string;
  /** Slug */
  slug: string;
  /** Name */
  name: string;
  /** Logo Svg */
  logo_svg: string | null;
  /** Brand Primary */
  brand_primary: string;
  /** Company Name */
  company_name: string | null;
  /** Industry */
  industry: Industry | string | null;
  /** Company Address */
  company_address: string | null;
  /** Website Url */
  website_url: string | null;
  company_size: CompanySize | null;
  /** Time Zone */
  time_zone: string | null;
  /** Primary Contact Name */
  primary_contact_name: string | null;
  /** Primary Contact Title */
  primary_contact_title: string | null;
  /** Primary Contact Email */
  primary_contact_email: string | null;
  /** Primary Contact Phone */
  primary_contact_phone: string | null;
  /** Primary Contact Whatsapp */
  primary_contact_whatsapp: string | null;
  /** Billing Contact Name */
  billing_contact_name: string | null;
  /** Billing Contact Email */
  billing_contact_email: string | null;
  /** Technical Contact Name */
  technical_contact_name: string | null;
  /** Technical Contact Email */
  technical_contact_email: string | null;
  /** Custom Domain */
  custom_domain: string | null;
}

/** TenantProvisionRequest */
export interface TenantProvisionRequest {
  /** Tenant Slug */
  tenant_slug: string;
  /**
   * Owner Email
   * @format email
   */
  owner_email: string;
  /** Tenant Name */
  tenant_name?: string | null;
  /** N8N Url */
  n8n_url?: string | null;
}

/** TenantProvisionResponse */
export interface TenantProvisionResponse {
  /** Success */
  success: boolean;
  /** Tenant Id */
  tenant_id: number;
  /** Tenant Slug */
  tenant_slug: string;
  /** Owner User Id */
  owner_user_id: string;
  /** Owner Email */
  owner_email: string;
  /** Membership Id */
  membership_id: string;
  /** Message */
  message: string;
}

/** TenantResolutionRequest */
export interface TenantResolutionRequest {
  /** Identifier */
  identifier: string;
  /**
   * Type
   * @default "auto"
   */
  type?: string | null;
}

/** TenantResolutionResponse */
export interface TenantResolutionResponse {
  /** Tenant Slug */
  tenant_slug?: string | null;
  /** Tenant Name */
  tenant_name?: string | null;
  /**
   * Is Super Admin
   * @default false
   */
  is_super_admin?: boolean;
  /**
   * Found
   * @default false
   */
  found?: boolean;
}

/** TenantStatus */
export enum TenantStatus {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
  Suspended = "suspended",
}

/** TenantUpdate */
export interface TenantUpdate {
  /** Name */
  name?: string | null;
  /** Display Name */
  display_name?: string | null;
  status?: TenantStatus | null;
  /** N8N Url */
  n8n_url?: string | null;
  /** N8N Api Key */
  n8n_api_key?: string | null;
  /** Database Url */
  database_url?: string | null;
  /** Billing Plan */
  billing_plan?: string | null;
  /** Billing Status */
  billing_status?: string | null;
  /** Trial Ends At */
  trial_ends_at?: string | null;
  /** Primary Color */
  primary_color?: string | null;
  /** Logo Url */
  logo_url?: string | null;
  /** Custom Domain */
  custom_domain?: string | null;
  /** Admin User Id */
  admin_user_id?: string | null;
  /** Technical Contact Email */
  technical_contact_email?: string | null;
}

/** TextItem */
export interface TextItem {
  /** Text content of the knowledge chunk */
  text: string;
  /** Chunk Id */
  chunk_id?: string;
  /** Distance */
  distance?: number;
}

/** UpsertKnowledgeRequest */
export interface UpsertKnowledgeRequest {
  /** Title */
  title: string;
  /** Content */
  content: string;
  /** Metadata */
  metadata?: Record<string, any> | null;
}

/** UpsertKnowledgeResponse */
export interface UpsertKnowledgeResponse {
  /** Id */
  id: string;
  /** Status */
  status: string;
}

/** UserRole */
export enum UserRole {
  Admin = "admin",
  User = "user",
  SuperAdmin = "super_admin",
}

/** UserRoleCreate */
export interface UserRoleCreate {
  /**
   * Email
   * @format email
   */
  email: string;
  /** @default "user" */
  role?: UserRole;
}

/** UserRoleInfo */
export interface UserRoleInfo {
  /** Id */
  id: string;
  /** Email */
  email: string;
  role: UserRole;
  /** Assigned By */
  assigned_by: string | null;
  /** Assigned At */
  assigned_at: string | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
}

/** UserStatusResponse */
export interface UserStatusResponse {
  /** Is Super Admin */
  is_super_admin: boolean;
  /** User Id */
  user_id: string;
  /** Email */
  email?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** WebChatSession */
export interface WebChatSession {
  /** Id */
  id?: number | null;
  /**
   * Session Key
   * @maxLength 255
   */
  session_key: string;
  /** Tenant Id */
  tenant_id: number;
  /**
   * Workflow Id
   * @maxLength 255
   */
  workflow_id: string;
  /**
   * User Id
   * @maxLength 255
   */
  user_id: string;
  /** Messages */
  messages?: Record<string, any>[];
  /** Created At */
  created_at?: string | null;
  /** Updated At */
  updated_at?: string | null;
}

/** WebChatSessionCreate */
export interface WebChatSessionCreate {
  /** Tenant Id */
  tenant_id: string;
  /** Workflow Id */
  workflow_id: string;
  /** User Id */
  user_id: string;
}

/** WorkflowInstallationRequest */
export interface WorkflowInstallationRequest {
  /** Master Workflow Id */
  master_workflow_id: string;
}

/** WorkflowInstallationResponse */
export interface WorkflowInstallationResponse {
  /** Success */
  success: boolean;
  /** Tenant Workflow Id */
  tenant_workflow_id?: string | null;
  /** Message */
  message: string;
  /** Iframe Url */
  iframe_url?: string | null;
}

/** WorkflowResponse */
export interface WorkflowResponse {
  /** Id */
  id: string;
  /** Name */
  name: string;
  /** Icon Url */
  icon_url: string;
  /** Description */
  description: string;
  /** Tags */
  tags: string[];
  /** Requires */
  requires: string[];
}

/** WorkflowsListResponse */
export interface WorkflowsListResponse {
  /** Workflows */
  workflows: WorkflowResponse[];
  /** Total */
  total: number;
}

export type CheckHealthData = HealthResponse;

export type SynthesizeData = AnswerResponse;

export type SynthesizeError = HTTPValidationError;

export type GenerateAnswerData = AnswerResponse;

export type GenerateAnswerError = HTTPValidationError;

/** Items */
export type PrepareContextPayload = TextItem[];

export type PrepareContextData = ContextResponse;

export type PrepareContextError = HTTPValidationError;

export type ConvertFileToMdData = ConvertFileResponse;

export type ConvertFileToMdError = HTTPValidationError;

export type ConvertUrlToMarkdownData = ConvertResponse;

export type ConvertUrlToMarkdownError = HTTPValidationError;

export type EmbedKnowledgeData = EmbedResponse;

export type EmbedKnowledgeError = HTTPValidationError;

export interface GetWorkflowTemplatesParams {
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
}

export type GetWorkflowTemplatesData = WorkflowsListResponse;

export type GetWorkflowTemplatesError = HTTPValidationError;

export type DebugJwtTokenData = JWTDebugResponse;

/** Response Debug Auth Status */
export type DebugAuthStatusData = Record<string, any>;

export type GetPreflightCheckData = PreflightSecretsResponse;

export type GetCurrentUserStatusData = UserStatusResponse;

export type InstallWorkflowData = WorkflowInstallationResponse;

export type InstallWorkflowError = HTTPValidationError;

export interface GetContextEnvelopeParams {
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
}

export type GetContextEnvelopeData = ContextEnvelope;

export type GetContextEnvelopeError = HTTPValidationError;

export type AddPasteData = AddPasteResponse;

export type AddPasteError = HTTPValidationError;

/** Response Get Postman Token */
export type GetPostmanTokenData = Record<string, any>;

export type IngestMessageData = MessageIngestResponse;

export type IngestMessageError = HTTPValidationError;

export type HealthCheckData = any;

export type GetPlatformManifestData = PlatformManifestResponse;

export type KnowledgeHealthData = any;

export interface GetKnowledgeIndexParams {
  tenantSlug: string;
}

export type GetKnowledgeIndexData = KnowledgeIndexResponse;

export interface UpsertKnowledgeIndexParams {
  tenantSlug: string;
}

export type UpsertKnowledgeIndexData = UpsertKnowledgeResponse;

export type UpsertKnowledgeIndexError = HTTPValidationError;

export type GetTenantProfileData = TenantProfileResponse;

export type UpdateTenantProfileData = TenantProfileResponse;

export type UpdateTenantProfileError = HTTPValidationError;

export type GetBrandingSettingsData = BrandingResponse;

export type UpdateBrandingSettingsData = BrandingResponse;

export type UpdateBrandingSettingsError = HTTPValidationError;

/** Response Upload Logo */
export type UploadLogoData = Record<string, any>;

export type UploadLogoError = HTTPValidationError;

export type ResetBrandingSettingsData = BrandingResponse;

export type GetHitlTasksLegacyData = any;

/** Response Get Hitl Tasks */
export type GetHitlTasksData = HitlTask[];

export type CreateHitlTaskData = any;

export type CreateHitlTaskError = HTTPValidationError;

export interface GetHitlTaskDetailParams {
  /** Task Id */
  taskId: string;
}

export type GetHitlTaskDetailData = HitlTaskDetail;

export type GetHitlTaskDetailError = HTTPValidationError;

export interface ResolveHitlTaskParams {
  /** Task Id */
  taskId: string;
}

export type ResolveHitlTaskData = ResolveTaskResponse;

export type ResolveHitlTaskError = HTTPValidationError;

export type SuspendTenantData = TenantLifecycleResponse;

export type SuspendTenantError = HTTPValidationError;

export type ReactivateTenantData = TenantLifecycleResponse;

export type ReactivateTenantError = HTTPValidationError;

export type SoftDeleteTenantData = TenantLifecycleResponse;

export type SoftDeleteTenantError = HTTPValidationError;

export type RestoreTenantData = TenantLifecycleResponse;

export type RestoreTenantError = HTTPValidationError;

export type HardDeleteTenantData = TenantLifecycleResponse;

export type HardDeleteTenantError = HTTPValidationError;

export interface GetTenantLifecycleStatusParams {
  /** Tenant Id */
  tenantId: number;
}

export type GetTenantLifecycleStatusData = any;

export type GetTenantLifecycleStatusError = HTTPValidationError;

export interface ResolveTenantParams {
  /** Email */
  email: string;
}

export type ResolveTenantData = TenantResolutionResponse;

export type ResolveTenantError = HTTPValidationError;

export type ResolveTenantByEmailData = TenantResolutionResponse;

export type ResolveTenantByEmailError = HTTPValidationError;

export interface ListTenantsParams {
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
}

/** Response List Tenants */
export type ListTenantsData = Tenant[];

export type ListTenantsError = HTTPValidationError;

export type CreateTenantData = Tenant;

export type CreateTenantError = HTTPValidationError;

export interface GetTenantBySlugParams {
  /** Tenant Slug */
  tenantSlug: string;
}

export type GetTenantBySlugData = Tenant;

export type GetTenantBySlugError = HTTPValidationError;

export interface UpdateTenantParams {
  /** Tenant Slug */
  tenantSlug: string;
}

export type UpdateTenantData = Tenant;

export type UpdateTenantError = HTTPValidationError;

export interface DeleteTenantParams {
  /** Tenant Slug */
  tenantSlug: string;
}

/** Response Delete Tenant */
export type DeleteTenantData = Record<string, any>;

export type DeleteTenantError = HTTPValidationError;

export interface UpdateTenantPoliciesParams {
  /** Tenant Slug */
  tenantSlug: string;
}

export type UpdateTenantPoliciesData = Tenant;

export type UpdateTenantPoliciesError = HTTPValidationError;

/** Response Check Super Admin */
export type CheckSuperAdminData = Record<string, any>;

export type CreateWebchatSessionData = WebChatSession;

export type CreateWebchatSessionError = HTTPValidationError;

export interface GetWebchatSessionParams {
  /** Session Key */
  sessionKey: string;
}

export type GetWebchatSessionData = WebChatSession;

export type GetWebchatSessionError = HTTPValidationError;

/** Response List Users */
export type ListUsersData = UserRoleInfo[];

export type CreateUserRoleData = UserRoleInfo;

export type CreateUserRoleError = HTTPValidationError;

/** Response Get Current User Role */
export type GetCurrentUserRoleData = Record<string, any>;

export type ProvisionTenantData = TenantProvisionResponse;

export type ProvisionTenantError = HTTPValidationError;

export type ServeFaviconData = any;
