


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminLayout } from "../components/AdminLayout";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import brain from "../brain";
import { TenantProvisionRequest } from "types";
import { useSuperAdmin } from "../components/AuthMiddleware";

const AdminProvisioning = () => {
  const { isSuperAdmin, isLoading: authLoading } = useSuperAdmin();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tenantName: "",
    tenantSlug: "",
    ownerEmail: "",
    n8nUrl: ""
  });

  // Auto-generate slug from tenant name
  const handleTenantNameChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setFormData(prev => ({ 
      ...prev, 
      tenantName: value,
      tenantSlug: slug
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.tenantName.trim()) {
      toast.error('Tenant name is required');
      return false;
    }
    if (!formData.tenantSlug.trim()) {
      toast.error('Tenant slug is required');
      return false;
    }
    if (!formData.ownerEmail.trim()) {
      toast.error('Owner email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!isSuperAdmin) {
      toast.error('Super admin privileges required to create tenants');
      return;
    }
    
    setLoading(true);
    try {
      const provisionData: TenantProvisionRequest = {
        tenant_slug: formData.tenantSlug,
        owner_email: formData.ownerEmail,
        tenant_name: formData.tenantName || null,
        n8n_url: formData.n8nUrl || null
      };
      
      console.log('Provisioning tenant with data:', provisionData);
      const response = await brain.provision_tenant(provisionData);
      const result = await response.json();
      console.log('Tenant provisioned successfully:', result);
      
      toast.success(`Tenant "${formData.tenantName}" provisioned successfully!`);
      
      // Reset form
      setFormData({
        tenantName: "",
        tenantSlug: "",
        ownerEmail: "",
        n8nUrl: ""
      });
      
    } catch (error) {
      console.error('Failed to provision tenant:', error);
      toast.error('Failed to provision tenant. Please check the logs for details.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking permissions
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  // Show access denied if not super admin
  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provision New Tenant</h1>
          <p className="text-muted-foreground">
            Create a new tenant with an initial owner user account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Configuration</CardTitle>
            <CardDescription>
              Enter the basic tenant information to create a new tenant instance.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input
                  id="tenantName"
                  value={formData.tenantName}
                  onChange={(e) => handleTenantNameChange(e.target.value)}
                  placeholder="ACME Corporation"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="tenantSlug">Tenant Slug *</Label>
                <Input
                  id="tenantSlug"
                  value={formData.tenantSlug}
                  onChange={(e) => handleInputChange("tenantSlug", e.target.value)}
                  placeholder="acme-corp"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be used in the subdomain: {formData.tenantSlug || 'tenant-slug'}.flomastr.com
                </p>
              </div>
              
              <div>
                <Label htmlFor="ownerEmail">Owner Email *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
                  placeholder="admin@acme.com"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This user will be created as the tenant owner with full administrative access.
                </p>
              </div>
              
              <div>
                <Label htmlFor="n8nUrl">N8N Instance URL</Label>
                <Input
                  id="n8nUrl"
                  value={formData.n8nUrl}
                  onChange={(e) => handleInputChange("n8nUrl", e.target.value)}
                  placeholder="https://acme-corp.n8n.flomastr.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: The N8N instance URL for this tenant's workflow automation.
                </p>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Additional tenant configuration (branding, company profile, contacts) 
                  can be set up later through the tenant's settings page after provisioning.
                </AlertDescription>
              </Alert>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Provisioning Tenant...
                  </>
                ) : (
                  "Provision Tenant"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProvisioning;
