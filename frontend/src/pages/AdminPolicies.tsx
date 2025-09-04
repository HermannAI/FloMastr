import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "components/AdminLayout";

interface PolicyConfig {
  confidence_default: number;
  hot_ttl_days: number;
  inbox_scope: string;
}

const AdminPolicies = () => {
  const [policies, setPolicies] = useState<PolicyConfig>({
    confidence_default: 0.75,
    hot_ttl_days: 30,
    inbox_scope: "databutton"
  });

  const handleSavePolicies = () => {
    toast.info("Save functionality not implemented (stub)");
  };

  const confidenceOptions = [
    { value: 0.5, label: "0.5 - Low Confidence", description: "More human escalation" },
    { value: 0.65, label: "0.65 - Medium-Low", description: "Balanced approach" },
    { value: 0.75, label: "0.75 - Medium (Default)", description: "Recommended setting" },
    { value: 0.85, label: "0.85 - High Confidence", description: "Less human escalation" },
    { value: 0.95, label: "0.95 - Very High", description: "Minimal human escalation" }
  ];

  const ttlOptions = [
    { value: 7, label: "7 days", description: "Short-term storage" },
    { value: 14, label: "14 days", description: "Bi-weekly cycle" },
    { value: 30, label: "30 days (Default)", description: "Monthly cycle" },
    { value: 60, label: "60 days", description: "Extended storage" },
    { value: 90, label: "90 days", description: "Long-term storage" }
  ];

  const scopeOptions = [
    { value: "databutton", label: "Databutton", description: "Default scope for Databutton platform" },
    { value: "tenant", label: "Tenant", description: "Tenant-specific inbox scope" },
    { value: "global", label: "Global", description: "Global inbox access" }
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Policies</h1>
          <p className="text-muted-foreground">Configure global system policies and default values</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Stub Implementation</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This is a read-only stub interface. Policy changes are not persisted and the save button is disabled.
              </p>
            </div>
          </div>
        </div>

        {/* Rest of the component content... */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Confidence Threshold
            </CardTitle>
            <CardDescription>
              Default confidence threshold for AI decision making across all tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="confidence">Default Confidence Threshold</Label>
              <Select 
                value={policies.confidence_default.toString()} 
                onValueChange={(value) => setPolicies(prev => ({ ...prev, confidence_default: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select confidence threshold" />
                </SelectTrigger>
                <SelectContent>
                  {confidenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Current: {policies.confidence_default} - Lower values increase human escalation
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data Retention (Hot TTL)
            </CardTitle>
            <CardDescription>
              Default time-to-live for hot data storage across all tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ttl">Hot TTL Days</Label>
              <Select 
                value={policies.hot_ttl_days.toString()} 
                onValueChange={(value) => setPolicies(prev => ({ ...prev, hot_ttl_days: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select TTL period" />
                </SelectTrigger>
                <SelectContent>
                  {ttlOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Current: {policies.hot_ttl_days} days - Data will be moved to cold storage after this period
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Inbox Scope
            </CardTitle>
            <CardDescription>
              Default inbox access scope for new tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scope">Default Inbox Scope</Label>
              <Select 
                value={policies.inbox_scope} 
                onValueChange={(value) => setPolicies(prev => ({ ...prev, inbox_scope: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inbox scope" />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Current: {policies.inbox_scope} - Controls default access level for new tenants
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={handleSavePolicies} disabled className="bg-muted text-muted-foreground cursor-not-allowed">
            Save Changes (Disabled - Stub)
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPolicies;
