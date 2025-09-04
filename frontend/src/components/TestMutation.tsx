import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TestMutation = () => {
  const queryClient = useQueryClient();

  const testMutation = useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: () => {
      console.log('Test mutation success');
      toast.success('Test successful');
    },
    onError: (error: any) => {
      console.error('Test mutation error:', error);
      toast.error('Test failed');
    },
  });

  return (
    <div className="p-4">
      <Button 
        onClick={() => testMutation.mutate()}
        disabled={testMutation.isPending}
      >
        {testMutation.isPending ? 'Testing...' : 'Test Mutation'}
      </Button>
    </div>
  );
};

export default TestMutation;
