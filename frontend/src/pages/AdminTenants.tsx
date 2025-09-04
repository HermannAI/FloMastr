



import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "components/AdminLayout";
import { Edit, Save, X, MoreHorizontal, Ban, RotateCcw, Archive, Trash2, AlertTriangle } from "lucide-react";
import brain from "brain";
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
  status: string;
  confidence_threshold: string;
  hot_ttl_days: number;
  inbox_scope: string;
  catalog_enabled: boolean;
  n8n_url: string | null;
  cold_db_ref: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null; // Add deleted_at field
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
      // Fetch full tenant profile
      const response = await brain.get_tenant_profile({ tenantId: tenant.slug });
      const profile = await response.json();
      
      setEditFormData({
        // Tenant Configuration
        cold_db_ref: tenant.cold_db_ref,
        
        // Company Information
        company_name: profile.company_name,
        industry: profile.industry,
        company_address: profile.company_address,
        website_url: profile.website_url,
        company_size: profile.company_size,
        time_zone: profile.time_zone,
        custom_domain: profile.custom_domain,
        
        // Branding
        brand_primary: profile.brand_primary,
        logo_svg: profile.logo_svg,
        
        // Contact Information
        primary_contact_name: profile.primary_contact_name,
        primary_contact_title: profile.primary_contact_title,
        primary_contact_email: profile.primary_contact_email,
        primary_contact_phone: profile.primary_contact_phone,
        primary_contact_whatsapp: profile.primary_contact_whatsapp,
        billing_contact_name: profile.billing_contact_name,
        billing_contact_email: profile.billing_contact_email,
        technical_contact_name: profile.technical_contact_name,
        technical_contact_email: profile.technical_contact_email,
      });
      
      // Handle custom industry
      if (profile.industry && !industryOptions.find(opt => opt.value === profile.industry)) {
        setShowCustomIndustry(true);
        setCustomIndustry(profile.industry);
      }
      
      setEditModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch tenant profile:', error);
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
      await brain.update_tenant_profile({ tenantId: editingTenant.slug }, updateData as TenantProfileRequest);
      
      // Update tenant basic info if cold_db_ref changed
      if (updateData.cold_db_ref !== editingTenant.cold_db_ref) {
        await brain.update_tenant({ tenantSlug: editingTenant.slug }, {
          cold_db_ref: updateData.cold_db_ref || null
        });
      }
      
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>TTL Days</TableHead>
                <TableHead>Inbox Scope</TableHead>
                <TableHead>Catalog</TableHead>
                <TableHead>N8N URL</TableHead>
                <TableHead>Cold DB</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status, tenant.deleted_at)}</TableCell>
                  <TableCell>{tenant.confidence_threshold}</TableCell>
                  <TableCell>{tenant.hot_ttl_days}</TableCell>
                  <TableCell>{tenant.inbox_scope}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.catalog_enabled ? "default" : "outline"}>
                      {tenant.catalog_enabled ? "ON" : "OFF"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
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
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tenant.cold_db_ref || <span className="text-muted-foreground">None</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(tenant)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {getLifecycleActions(tenant).map(({ action, label, icon: Icon, variant }) => (
                          <DropdownMenuItem
                            key={action}
                            onClick={() => openLifecycleConfirmation(action, tenant)}
                            className={variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No tenants found
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant: {editingTenant?.name}</DialogTitle>
            <DialogDescription>
              Update tenant configuration, company information, branding, and contact details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuration</h3>
              
              <div>
                <Label htmlFor="cold_db_ref">Cold Database Reference</Label>
                <Input
                  id="cold_db_ref"
                  value={editFormData.cold_db_ref || ''}
                  onChange={(e) => handleInputChange('cold_db_ref', e.target.value)}
                  placeholder="cold-db-123"
                />
              </div>
              
              <div>
                <Label htmlFor="custom_domain">Custom Domain</Label>
                <Input
                  id="custom_domain"
                  value={editFormData.custom_domain || ''}
                  onChange={(e) => handleInputChange('custom_domain', e.target.value)}
                  placeholder="flomastr.com/yourdomain"
                />
              </div>
            </div>
            
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
              
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={editFormData.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="ACME Corporation"
                />
              </div>
              
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={editFormData.industry || ''}
                  onValueChange={handleIndustryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {showCustomIndustry && (
                <div>
                  <Label htmlFor="customIndustry">Specify Industry</Label>
                  <Input
                    id="customIndustry"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="Enter your industry"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={editFormData.company_size || ''}
                  onValueChange={(value) => handleInputChange('company_size', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={editFormData.website_url || ''}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="time_zone">Time Zone</Label>
                <Select
                  value={editFormData.time_zone || ''}
                  onValueChange={(value) => handleInputChange('time_zone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Company Address */}
            <div className="md:col-span-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={editFormData.company_address || ''}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Company address"
                rows={3}
              />
            </div>
            
            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Branding</h3>
              
              <div>
                <Label htmlFor="brand_primary">Primary Color</Label>
                <Input
                  id="brand_primary"
                  type="color"
                  value={editFormData.brand_primary || '#0052cc'}
                  onChange={(e) => handleInputChange('brand_primary', e.target.value)}
                />
              </div>
            </div>
            
            {/* Primary Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Primary Contact</h3>
              
              <div>
                <Label htmlFor="primary_contact_name">Contact Name</Label>
                <Input
                  id="primary_contact_name"
                  value={editFormData.primary_contact_name || ''}
                  onChange={(e) => handleInputChange('primary_contact_name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <Label htmlFor="primary_contact_title">Title</Label>
                <Input
                  id="primary_contact_title"
                  value={editFormData.primary_contact_title || ''}
                  onChange={(e) => handleInputChange('primary_contact_title', e.target.value)}
                  placeholder="CEO"
                />
              </div>
              
              <div>
                <Label htmlFor="primary_contact_email">Email</Label>
                <Input
                  id="primary_contact_email"
                  type="email"
                  value={editFormData.primary_contact_email || ''}
                  onChange={(e) => handleInputChange('primary_contact_email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="primary_contact_phone">Phone</Label>
                <Input
                  id="primary_contact_phone"
                  value={editFormData.primary_contact_phone || ''}
                  onChange={(e) => handleInputChange('primary_contact_phone', e.target.value)}
                  placeholder="+1-555-123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="primary_contact_whatsapp">WhatsApp</Label>
                <Input
                  id="primary_contact_whatsapp"
                  value={editFormData.primary_contact_whatsapp || ''}
                  onChange={(e) => handleInputChange('primary_contact_whatsapp', e.target.value)}
                  placeholder="+1-555-123-4567"
                />
              </div>
            </div>
            
            {/* Additional Contacts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Contacts</h3>
              
              <div>
                <Label htmlFor="billing_contact_name">Billing Contact Name</Label>
                <Input
                  id="billing_contact_name"
                  value={editFormData.billing_contact_name || ''}
                  onChange={(e) => handleInputChange('billing_contact_name', e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              
              <div>
                <Label htmlFor="billing_contact_email">Billing Contact Email</Label>
                <Input
                  id="billing_contact_email"
                  type="email"
                  value={editFormData.billing_contact_email || ''}
                  onChange={(e) => handleInputChange('billing_contact_email', e.target.value)}
                  placeholder="billing@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="technical_contact_name">Technical Contact Name</Label>
                <Input
                  id="technical_contact_name"
                  value={editFormData.technical_contact_name || ''}
                  onChange={(e) => handleInputChange('technical_contact_name', e.target.value)}
                  placeholder="Bob Johnson"
                />
              </div>
              
              <div>
                <Label htmlFor="technical_contact_email">Technical Contact Email</Label>
                <Input
                  id="technical_contact_email"
                  type="email"
                  value={editFormData.technical_contact_email || ''}
                  onChange={(e) => handleInputChange('technical_contact_email', e.target.value)}
                  placeholder="tech@example.com"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Lifecycle Confirmation Modal */}
      <AlertDialog open={lifecycleConfirmation.isOpen} onOpenChange={(open) => {
        if (!open) closeLifecycleConfirmation();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {lifecycleConfirmation.action === 'hard_delete' && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {lifecycleConfirmation.action && getConfirmationConfig(lifecycleConfirmation.action).title || 'Confirm Action'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {lifecycleConfirmation.action ? getConfirmationConfig(lifecycleConfirmation.action).description : 'Please confirm this action.'}
              </p>
              {lifecycleConfirmation.tenant && (
                <div className="bg-muted p-3 rounded-md">
                  <p><strong>Tenant:</strong> {lifecycleConfirmation.tenant.name} ({lifecycleConfirmation.tenant.slug})</p>
                  <p><strong>Current Status:</strong> {getStatusBadge(lifecycleConfirmation.tenant.status, lifecycleConfirmation.tenant.deleted_at)}</p>
                </div>
              )}
              {lifecycleConfirmation.action === 'hard_delete' && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                  <p className="text-destructive font-medium">⚠️ WARNING: This action is irreversible!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All tenant data including contacts, messages, workflows, knowledge base, and settings will be permanently deleted.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {lifecycleConfirmation.action && getConfirmationConfig(lifecycleConfirmation.action).requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Required)</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for this action..."
                value={lifecycleConfirmation.reason}
                onChange={(e) => setLifecycleConfirmation(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={lifecycleLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLifecycleAction}
              disabled={lifecycleLoading}
              className={lifecycleConfirmation.action && getConfirmationConfig(lifecycleConfirmation.action).variant === 'destructive' 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : ''}
            >
              {lifecycleLoading ? 'Processing...' : (
                lifecycleConfirmation.action 
                  ? getConfirmationConfig(lifecycleConfirmation.action).confirmText 
                  : 'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminTenants;
