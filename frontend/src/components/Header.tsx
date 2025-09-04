
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useTenant } from 'utils/TenantProvider';

interface HeaderProps {
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleTheme, isDarkMode }) => {
  const { tenant, tenantSlug } = useTenant();

  // FloMastr static logo URL
  const FLOMASTR_LOGO_URL = "https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/FloMastr-App.svg";

  return (
    <header className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side: Logo and Company Name */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-border flex items-center justify-center flex-shrink-0">
              <img 
                src={FLOMASTR_LOGO_URL} 
                alt="FloMastr" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  console.error('Failed to load FloMastr logo:', e);
                  // Show fallback text
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    container.innerHTML = '<span class="text-primary font-bold text-sm">FM</span>';
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {tenant?.name || 'FloMastr'}
              </h1>
              <p className="text-sm text-muted-foreground">
                AI Business Partner
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Theme Toggle */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
