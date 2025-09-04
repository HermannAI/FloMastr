import React from "react";
import { Header } from "components/Header";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const Layout = ({ children, showNavigation = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header showNavigation={showNavigation} />
      
      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col space-y-4 text-center md:text-left">
            {/* Legal Text */}
            <p className="text-sm text-muted-foreground">
              © 2025 ChangeMastr FZ-LLC, RAKEZ, UAE. All rights reserved. WhappStream is not affiliated with Meta, Facebook, or WhatsApp.
            </p>
            
            <Separator className="my-2" />
            
            {/* Footer Links */}
            <div className="flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0 text-sm">
              <a 
                href="/privacy-policy" 
                className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms-of-service" 
                className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Terms of Service
              </a>
              <a 
                href="/data-deletion" 
                className="text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Data Deletion Instructions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
