

import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Workflow as WorkflowIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WorkflowCard } from "@/components/WorkflowCard";
import { FilterBar } from "@/components/FilterBar";
import brain from "@/brain";
import { WorkflowResponse } from "@/brain/data-contracts";

interface WorkflowsData {
  workflows: WorkflowResponse[];
  total: number;
}

export default function Workflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("name");

  // Get available tags from workflows
  const availableTags = React.useMemo(() => {
    const allTags = workflows.flatMap(w => w.tags);
    return [...new Set(allTags)].sort();
  }, [workflows]);

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams: { search?: string; tags?: string; sort?: string } = {};
      if (searchTerm) queryParams.search = searchTerm;
      if (selectedTags.length > 0) queryParams.tags = selectedTags.join(",");
      if (sortBy) queryParams.sort = sortBy;
      
      const response = await brain.get_workflow_templates(queryParams);
      const data: WorkflowsData = await response.json();
      
      setWorkflows(data.workflows);
    } catch (err) {
      console.error('Failed to fetch workflow templates:', err);
      setError('Failed to load workflow templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWorkflows();
    }, 300); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedTags, sortBy]);

  const handleSearch = (search: string) => {
    setSearchTerm(search);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSortBy("name");
  };

  return (
    <Layout>
      {/* Filter Bar */}
      <div className="mb-8">
        <FilterBar
          searchTerm={searchTerm}
          selectedTags={selectedTags}
          sortBy={sortBy}
          availableTags={availableTags}
          onSearchChange={setSearchTerm}
          onTagToggle={handleTagToggle}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchWorkflows} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && workflows.length === 0 && (
        <div className="text-center py-16">
          <WorkflowIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedTags.length > 0 
              ? "Try adjusting your filters to see more results."
              : "No workflows are available at the moment."
            }
          </p>
          {(searchTerm || selectedTags.length > 0) && (
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Workflows Grid */}
      {!loading && !error && workflows.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                id={workflow.id}
                name={workflow.name}
                icon_url={workflow.icon_url}
                description={workflow.description}
                tags={workflow.tags}
                requires={workflow.requires}
              />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
