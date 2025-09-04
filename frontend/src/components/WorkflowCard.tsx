


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useTenantNavigation } from "utils/navigation";

interface WorkflowCardProps {
  id: string;
  name: string;
  icon_url: string;
  description: string;
  tags: string[];
  requires: string[];
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ id, name, icon_url, description, tags, requires }) => {
  const { navigateWithTenant } = useTenantNavigation();
  
  const handleInstall = () => {
    navigateWithTenant(`/workflow-install/${id}`);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {icon_url ? (
              <img 
                src={icon_url} 
                alt={`${name} icon`} 
                className="w-6 h-6"
                onError={(e) => {
                  // Fallback to a generic icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-6 h-6 rounded bg-[var(--brand-primary)] ${icon_url ? 'hidden' : ''}`} />
          </div>
          
          {/* Title */}
          <CardTitle className="text-lg leading-tight">{name}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed mb-4">
          {description}
        </CardDescription>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Requirements */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Requires:</p>
          <div className="flex flex-wrap gap-1.5">
            {requires.map((req) => (
              <Badge key={req} variant="outline" className="text-xs">
                {req}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Install Button */}
        <Button 
          onClick={handleInstall}
          className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90"
          size="sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Install Workflow
        </Button>
      </CardContent>
    </Card>
  );
};

export interface Props {
  id: string;
  name: string;
  icon_url: string;
  description: string;
  tags: string[];
  requires: string[];
}

export { WorkflowCard };
export default WorkflowCard;
