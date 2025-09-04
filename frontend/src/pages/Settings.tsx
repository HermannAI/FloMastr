
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import brain from 'brain';
import { useTenant } from 'utils/TenantProvider';
import type { TenantProfileResponse, UpdateTenantProfileRequest } from 'types';

export default function Settings() {
  const { tenantSlug } = useTenant();
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantName, setTenantName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [n8nUrl, setN8nUrl] = useState('');
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
        const profileResponse = await brain.get_tenant_profile({ tenantId: tenantSlug });
        const profileData: TenantProfileResponse = await profileResponse.json();
        
        setTenantName(profileData.name);
        setContactEmail(profileData.contact_email || '');
        setN8nUrl(profileData.n8n_url || '');
        setStatus(profileData.status);
        
        // Fetch branding settings
        const brandingResponse = await brain.get_branding_settings({ tenantId: tenantSlug });
        const brandingData = await brandingResponse.json();
        
        setPrimaryColor(brandingData.primary_color || '#0052cc');
        setExistingLogoUrl(brandingData.logo_url);
      } catch (error) {
        console.error('Failed to load tenant data:', error);
        setError('Failed to load tenant information');
      }
    };

    loadTenantData();
  }, [tenantSlug]);
}
