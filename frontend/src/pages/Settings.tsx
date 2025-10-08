
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';
import brain from 'brain';
import { useTenant } from 'utils/TenantProvider';
import type { TenantProfileResponse, TenantProfileRequest, BrandingResponse } from '../brain/data-contracts';

export default function Settings() {
  const { tenantSlug } = useTenant();
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantName, setTenantName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#0052cc');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

  // Load tenant data on mount
  useEffect(() => {
    const loadTenantData = async () => {
      if (!tenantSlug) {
        setError('No tenant available');
        return;
      }
      
      try {
        setTenantId(tenantSlug);
        
        // Fetch tenant profile
        const profileResponse = await brain.get_tenant_profile();
        const profileData: TenantProfileResponse = await profileResponse.json();
        
        setTenantName(profileData.name);
        setContactEmail(profileData.primary_contact_email || '');
        setStatus('active'); // Default status since it's not in the response
        
        // Fetch branding settings
        const brandingResponse = await brain.get_branding_settings();
        const brandingData: BrandingResponse = await brandingResponse.json();
        
        setPrimaryColor(brandingData.brand_primary || '#0052cc');
        setExistingLogoUrl(brandingData.logo_svg);
      } catch (error) {
        console.error('Failed to load tenant data:', error);
        setError('Failed to load tenant information');
      }
    };

    loadTenantData();
  }, [tenantSlug]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <p className="text-muted-foreground">Settings page is under development.</p>
    </Layout>
  );
}
