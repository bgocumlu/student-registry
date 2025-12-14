import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface CollapsibleCourseSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Called when section is expanded for the first time. Return data or use to trigger fetch. */
  onFirstExpand?: () => Promise<void> | void;
  /** External loading state - use when parent controls loading */
  isLoading?: boolean;
}

export function CollapsibleCourseSection({ 
  title, 
  subtitle, 
  children, 
  defaultOpen = false,
  onFirstExpand,
  isLoading: externalLoading,
}: CollapsibleCourseSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasExpanded, setHasExpanded] = useState(defaultOpen);
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;

  const handleOpenChange = useCallback(async (open: boolean) => {
    setIsOpen(open);
    
    if (open && !hasExpanded && onFirstExpand) {
      setHasExpanded(true);
      setInternalLoading(true);
      try {
        await onFirstExpand();
      } finally {
        setInternalLoading(false);
      }
    } else if (open && !hasExpanded) {
      setHasExpanded(true);
    }
  }, [hasExpanded, onFirstExpand]);

  // If defaultOpen and has onFirstExpand, trigger it on mount
  useEffect(() => {
    if (defaultOpen && onFirstExpand && !hasExpanded) {
      setHasExpanded(true);
      setInternalLoading(true);
      Promise.resolve(onFirstExpand()).finally(() => {
        setInternalLoading(false);
      });
    }
  }, []); // Only run on mount

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-semibold">{title}</span>
            {subtitle && (
              <span className="text-sm text-muted-foreground">({subtitle})</span>
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasExpanded ? (
            children
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
