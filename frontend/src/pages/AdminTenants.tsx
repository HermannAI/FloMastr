



import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

// All UI component imports are commented out as they don't exist
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
// import { Textarea } from "../components/ui/textarea";

// Available UI components
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AdminLayout } from "../components/AdminLayout";
import { Edit, Save, X, MoreHorizontal, Ban, RotateCcw, Archive, Trash2, AlertTriangle } from "lucide-react";
import brain from "../brain";
import { toast } from "sonner";
import { TenantProfileRequest, CompanySize, Industry } from "types";

// Industry options matching Settings page
const industryOptions = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "government", label: "Government" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Other" }
];

const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" }
];

const timezoneOptions = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "EST (Eastern Time)" },
  { value: "America/Chicago", label: "CST (Central Time)" },
  { value: "America/Denver", label: "MST (Mountain Time)" },
  { value: "America/Los_Angeles", label: "PST (Pacific Time)" },
  { value: "Europe/London", label: "GMT (Greenwich Mean Time)" },
  { value: "Europe/Berlin", label: "CET (Central European Time)" },
  { value: "Asia/Dubai", label: "GST (Gulf Standard Time)" },
  { value: "Asia/Tokyo", label: "JST (Japan Standard Time)" },
  { value: "Australia/Sydney", label: "AEST (Australian Eastern Time)" }
];

interface Tenant {
  id: number;
  slug: string;
  name: string;
  n8n_url?: string | null;
  status: string;
  branding_settings?: Record<string, any>;
  confidence_threshold?: string;
  hot_ttl_days?: number;
  inbox_scope?: string;
  catalog_enabled?: boolean;
  cold_db_ref?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  company_name?: string | null;
  industry?: string | null;
  company_address?: string | null;
  website_url?: string | null;
  company_size?: string | null;
  time_zone?: string | null;
  primary_contact_name?: string | null;
  primary_contact_title?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  primary_contact_whatsapp?: string | null;
  billing_contact_name?: string | null;
  billing_contact_email?: string | null;
  technical_contact_name?: string | null;
  technical_contact_email?: string | null;
  custom_domain?: string | null;
}

type LifecycleAction = 'suspend' | 'reactivate' | 'soft_delete' | 'restore' | 'hard_delete';

interface LifecycleConfirmation {
  isOpen: boolean;
  action: LifecycleAction | null;
  tenant: Tenant | null;
  reason: string;
}

const AdminTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TenantProfileRequest>>({});
  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Lifecycle management state
  const [lifecycleConfirmation, setLifecycleConfirmation] = useState<LifecycleConfirmation>({
    isOpen: false,
    action: null,
    tenant: null,
    reason: ''
  });
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await brain.list_tenants({ limit: 500 }); // Increase limit to show all tenants
        const data = await response.json();
        setTenants(data);
      } catch (error) {
        toast.error("Failed to load tenants");
        console.error("Error fetching tenants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const openEditModal = async (tenant: Tenant) => {
    setEditingTenant(tenant);
    try {
      // Use tenant data directly (most profile fields are already in the Tenant object)
      setEditFormData({
        // Tenant Configuration
        cold_db_ref: tenant.cold_db_ref,

        // Company Information
        company_name: tenant.company_name,
        industry: tenant.industry,
        company_address: tenant.company_address,
        website_url: tenant.website_url,
        company_size: tenant.company_size as CompanySize | undefined,
        time_zone: tenant.time_zone,
        custom_domain: tenant.custom_domain,

        // Branding (from branding_settings if available)
        brand_primary: tenant.branding_settings?.brand_primary || '#0052cc',
        logo_svg: tenant.branding_settings?.logo_svg,

        // Contact Information
        primary_contact_name: tenant.primary_contact_name,
        primary_contact_title: tenant.primary_contact_title,
        primary_contact_email: tenant.primary_contact_email,
        primary_contact_phone: tenant.primary_contact_phone,
        primary_contact_whatsapp: tenant.primary_contact_whatsapp,
        billing_contact_name: tenant.billing_contact_name,
        billing_contact_email: tenant.billing_contact_email,
        technical_contact_name: tenant.technical_contact_name,
        technical_contact_email: tenant.technical_contact_email,
      });

      // Handle custom industry
      if (tenant.industry && !industryOptions.find(opt => opt.value === tenant.industry)) {
        setShowCustomIndustry(true);
        setCustomIndustry(tenant.industry);
      }

      setEditModalOpen(true);
    } catch (error) {
      console.error('Failed to load tenant details:', error);
      toast.error('Failed to load tenant details');
    }
  };

  const handleSave = async () => {
    if (!editingTenant) return;
    
    setSaving(true);
    try {
      // Prepare data for update
      const updateData = { ...editFormData };
      
      // Handle custom industry
      if (showCustomIndustry && customIndustry.trim()) {
        updateData.industry = customIndustry.trim();
      }
      
      // Update tenant profile
      await brain.update_tenant_profile(updateData as TenantProfileRequest);
      
      toast.success('Tenant updated successfully!');
      setEditModalOpen(false);
      
      // Refresh tenants list
      const tenantsResponse = await brain.list_tenants({ limit: 500 });
      const tenantsData = await tenantsResponse.json();
      setTenants(tenantsData);
      
    } catch (error) {
      console.error('Failed to update tenant:', error);
      toast.error('Failed to update tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TenantProfileRequest, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIndustryChange = (value: string) => {
    if (value === 'other') {
      setShowCustomIndustry(true);
      setEditFormData(prev => ({ ...prev, industry: '' }));
    } else {
      setShowCustomIndustry(false);
      setCustomIndustry('');
      setEditFormData(prev => ({ ...prev, industry: value }));
    }
  };

  const getStatusBadge = (status: string, deletedAt?: string | null) => {
    if (deletedAt) {
      return <Badge variant="destructive">DELETED</Badge>;
    }
    
    switch (status) {
      case "active":
        return <Badge variant="default">ACTIVE</Badge>;
      case "suspended":
        return <Badge variant="secondary">SUSPENDED</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };
  
  // Lifecycle action handlers
  const openLifecycleConfirmation = (action: LifecycleAction, tenant: Tenant) => {
    setLifecycleConfirmation({
      isOpen: true,
      action,
      tenant,
      reason: ''
    });
  };
  
  const closeLifecycleConfirmation = () => {
    setLifecycleConfirmation({
      isOpen: false,
      action: null,
      tenant: null,
      reason: ''
    });
  };
  
  const handleLifecycleAction = async () => {
    const { action, tenant, reason } = lifecycleConfirmation;
    if (!action || !tenant) return;
    
    // Validate reason for hard delete
    if (action === 'hard_delete' && !reason.trim()) {
      toast.error('Reason is required for hard delete operations');
      return;
    }
    
    setLifecycleLoading(true);
    try {
      const requestData = {
        tenant_id: tenant.id,
        action,
        reason: reason.trim() || undefined
      };
      
      let response;
      switch (action) {
        case 'suspend':
          response = await brain.suspend_tenant(requestData);
          break;
        case 'reactivate':
          response = await brain.reactivate_tenant(requestData);
          break;
        case 'soft_delete':
          response = await brain.soft_delete_tenant(requestData);
          break;
        case 'restore':
          response = await brain.restore_tenant(requestData);
          break;
        case 'hard_delete':
          response = await brain.hard_delete_tenant(requestData);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      const result = await response.json();
      toast.success(result.message);
      
      // Refresh tenants list
      const tenantsResponse = await brain.list_tenants({ limit: 500 });
      const tenantsData = await tenantsResponse.json();
      setTenants(tenantsData);
      
      closeLifecycleConfirmation();
      
    } catch (error) {
      console.error('Lifecycle action failed:', error);
      toast.error(`Failed to ${action.replace('_', ' ')} tenant`);
    } finally {
      setLifecycleLoading(false);
    }
  };
  
  const getLifecycleActions = (tenant: Tenant): { action: LifecycleAction; label: string; icon: any; variant?: 'default' | 'destructive' }[] => {
    const actions = [];
    
    if (tenant.deleted_at) {
      // Soft deleted tenant can be restored or hard deleted
      actions.push(
        { action: 'restore' as LifecycleAction, label: 'Restore', icon: RotateCcw },
        { action: 'hard_delete' as LifecycleAction, label: 'Hard Delete', icon: Trash2, variant: 'destructive' as const }
      );
    } else if (tenant.status === 'suspended') {
      // Suspended tenant can be reactivated or soft deleted
      actions.push(
        { action: 'reactivate' as LifecycleAction, label: 'Reactivate', icon: RotateCcw },
        { action: 'soft_delete' as LifecycleAction, label: 'Soft Delete', icon: Archive, variant: 'destructive' as const }
      );
    } else {
      // Active tenant can be suspended or soft deleted
      actions.push(
        { action: 'suspend' as LifecycleAction, label: 'Suspend', icon: Ban },
        { action: 'soft_delete' as LifecycleAction, label: 'Soft Delete', icon: Archive, variant: 'destructive' as const }
      );
    }
    
    return actions;
  };
  
  const getConfirmationConfig = (action: LifecycleAction) => {
    switch (action) {
      case 'suspend':
        return {
          title: 'Suspend Tenant',
          description: 'This will disable tenant access but preserve all data. This action is reversible.',
          confirmText: 'Suspend',
          requiresReason: false,
          variant: 'default' as const
        };
      case 'reactivate':
        return {
          title: 'Reactivate Tenant',
          description: 'This will restore tenant access and reactivate all services.',
          confirmText: 'Reactivate',
          requiresReason: false,
          variant: 'default' as const
        };
      case 'soft_delete':
        return {
          title: 'Soft Delete Tenant',
          description: 'This will hide the tenant from normal listings but preserve all data. This action is reversible.',
          confirmText: 'Soft Delete',
          requiresReason: false,
          variant: 'destructive' as const
        };
      case 'restore':
        return {
          title: 'Restore Tenant',
          description: 'This will restore the tenant and make it visible in normal listings again.',
          confirmText: 'Restore',
          requiresReason: false,
          variant: 'default' as const
        };
      case 'hard_delete':
        return {
          title: 'Hard Delete Tenant',
          description: 'This will PERMANENTLY delete the tenant and ALL related data including contacts, messages, workflows, and settings. This action is IRREVERSIBLE and cannot be undone.',
          confirmText: 'Permanently Delete',
          requiresReason: true,
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to perform this action?',
          confirmText: 'Confirm',
          requiresReason: false,
          variant: 'default' as const
        };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-muted-foreground">Manage tenant organizations and their configurations</p>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Slug</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Confidence</th>
                <th className="border border-gray-300 px-4 py-2 text-left">TTL Days</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Inbox Scope</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Catalog</th>
                <th className="border border-gray-300 px-4 py-2 text-left">N8N URL</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Cold DB</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{tenant.slug}</td>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{tenant.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{getStatusBadge(tenant.status, tenant.deleted_at)}</td>
                  <td className="border border-gray-300 px-4 py-2">{tenant.confidence_threshold}</td>
                  <td className="border border-gray-300 px-4 py-2">{tenant.hot_ttl_days}</td>
                  <td className="border border-gray-300 px-4 py-2">{tenant.inbox_scope}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Badge variant={tenant.catalog_enabled ? "default" : "outline"}>
                      {tenant.catalog_enabled ? "ON" : "OFF"}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 font-mono text-xs">
                    {tenant.n8n_url ? (
                      <a
                        href={tenant.n8n_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {tenant.n8n_url.replace('https://', '')}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 font-mono text-xs">
                    {tenant.cold_db_ref || <span className="text-muted-foreground">None</span>}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-xs text-gray-600">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(tenant)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No tenants found
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Tenant: {editingTenant?.name}</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Update tenant configuration, company information, branding, and contact details.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration</h3>

                  <div>
                    <Label htmlFor="cold_db_ref">Cold Database Reference</Label>
                    <input
                      id="cold_db_ref"
                      value={editFormData.cold_db_ref || ''}
                      onChange={(e) => handleInputChange('cold_db_ref', e.target.value)}
                      placeholder="cold-db-123"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="custom_domain">Custom Domain</Label>
                    <input
                      id="custom_domain"
                      value={editFormData.custom_domain || ''}
                      onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                      placeholder="flomastr.com/yourdomain"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Company Information</h3>

                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <input
                      id="company_name"
                      value={editFormData.company_name || ''}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="ACME Corporation"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <select
                      id="industry"
                      value={editFormData.industry || ''}
                      onChange={(e) => handleIndustryChange(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select industry</option>
                      {industryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showCustomIndustry && (
                    <div>
                      <Label htmlFor="customIndustry">Specify Industry</Label>
                      <input
                        id="customIndustry"
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                        placeholder="Enter your industry"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="company_size">Company Size</Label>
                    <select
                      id="company_size"
                      value={editFormData.company_size || ''}
                      onChange={(e) => handleInputChange('company_size', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select company size</option>
                      {companySizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <input
                      id="website_url"
                      value={editFormData.website_url || ''}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      placeholder="https://example.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time_zone">Time Zone</Label>
                    <select
                      id="time_zone"
                      value={editFormData.time_zone || ''}
                      onChange={(e) => handleInputChange('time_zone', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select timezone</option>
                      {timezoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Company Address */}
                <div className="md:col-span-2">
                  <Label htmlFor="company_address">Company Address</Label>
                  <textarea
                    id="company_address"
                    value={editFormData.company_address || ''}
                    onChange={(e) => handleInputChange('company_address', e.target.value)}
                    placeholder="Company address"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Branding */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Branding</h3>

                  <div>
                    <Label htmlFor="brand_primary">Primary Color</Label>
                    <input
                      id="brand_primary"
                      type="color"
                      value={editFormData.brand_primary || '#0052cc'}
                      onChange={(e) => handleInputChange('brand_primary', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Primary Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Primary Contact</h3>

                  <div>
                    <Label htmlFor="primary_contact_name">Contact Name</Label>
                    <input
                      id="primary_contact_name"
                      value={editFormData.primary_contact_name || ''}
                      onChange={(e) => handleInputChange('primary_contact_name', e.target.value)}
                      placeholder="John Doe"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_contact_title">Title</Label>
                    <input
                      id="primary_contact_title"
                      value={editFormData.primary_contact_title || ''}
                      onChange={(e) => handleInputChange('primary_contact_title', e.target.value)}
                      placeholder="CEO"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_contact_email">Email</Label>
                    <input
                      id="primary_contact_email"
                      type="email"
                      value={editFormData.primary_contact_email || ''}
                      onChange={(e) => handleInputChange('primary_contact_email', e.target.value)}
                      placeholder="john@example.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_contact_phone">Phone</Label>
                    <input
                      id="primary_contact_phone"
                      value={editFormData.primary_contact_phone || ''}
                      onChange={(e) => handleInputChange('primary_contact_phone', e.target.value)}
                      placeholder="+1-555-123-4567"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_contact_whatsapp">WhatsApp</Label>
                    <input
                      id="primary_contact_whatsapp"
                      value={editFormData.primary_contact_whatsapp || ''}
                      onChange={(e) => handleInputChange('primary_contact_whatsapp', e.target.value)}
                      placeholder="+1-555-123-4567"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Additional Contacts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Contacts</h3>

                  <div>
                    <Label htmlFor="billing_contact_name">Billing Contact Name</Label>
                    <input
                      id="billing_contact_name"
                      value={editFormData.billing_contact_name || ''}
                      onChange={(e) => handleInputChange('billing_contact_name', e.target.value)}
                      placeholder="Jane Smith"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing_contact_email">Billing Contact Email</Label>
                    <input
                      id="billing_contact_email"
                      type="email"
                      value={editFormData.billing_contact_email || ''}
                      onChange={(e) => handleInputChange('billing_contact_email', e.target.value)}
                      placeholder="billing@example.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="technical_contact_name">Technical Contact Name</Label>
                    <input
                      id="technical_contact_name"
                      value={editFormData.technical_contact_name || ''}
                      onChange={(e) => handleInputChange('technical_contact_name', e.target.value)}
                      placeholder="Bob Johnson"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="technical_contact_email">Technical Contact Email</Label>
                    <input
                      id="technical_contact_email"
                      type="email"
                      value={editFormData.technical_contact_email || ''}
                      onChange={(e) => handleInputChange('technical_contact_email', e.target.value)}
                      placeholder="tech@example.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Lifecycle Confirmation Modal - Temporarily disabled */}
      {/* TODO: Implement AlertDialog or use window.confirm for lifecycle actions */}
      {lifecycleConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="mb-4">
              {lifecycleConfirmation.action ? getConfirmationConfig(lifecycleConfirmation.action).description : 'Please confirm this action.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={closeLifecycleConfirmation}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={lifecycleLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleLifecycleAction}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={lifecycleLoading}
              >
                {lifecycleLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTenants;
