import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  searchTerm: string;
  selectedTags: string[];
  sortBy: string;
  availableTags: string[];
  onSearchChange: (search: string) => void;
  onTagToggle: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

export const FilterBar = ({
  searchTerm,
  selectedTags,
  sortBy,
  availableTags,
  onSearchChange,
  onTagToggle,
  onSortChange,
  onClearFilters
}: FilterBarProps) => {
  const [searchInput, setSearchInput] = useState(searchTerm);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const hasActiveFilters = searchTerm || selectedTags.length > 0 || sortBy !== "name";

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search workflows..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="tags">Most Tags</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="shrink-0"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Tag Filters */}
      <div>
        <p className="text-sm font-medium mb-3">Filter by tags:</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
                {isSelected && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          <span>Active filters: </span>
          {searchTerm && <span className="font-medium">Search: "{searchTerm}" </span>}
          {selectedTags.length > 0 && <span className="font-medium">Tags: {selectedTags.join(", ")} </span>}
          {sortBy !== "name" && <span className="font-medium">Sort: {sortBy} </span>}
        </div>
      )}
    </div>
  );
};

export interface Props {
  searchTerm: string;
  selectedTags: string[];
  sortBy: string;
  availableTags: string[];
  onSearchChange: (search: string) => void;
  onTagToggle: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}
