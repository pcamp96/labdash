import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { DashboardLayout } from "@/types/widgets";

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  layout: DashboardLayout | null;
  createdAt: string;
  updatedAt: string;
  widgets: any[];
}

/**
 * Hook for managing dashboard data with real-time auto-save
 */
export function useDashboard(dashboardId?: string) {
  const queryClient = useQueryClient();

  // Fetch all dashboards
  const {
    data: dashboards,
    isLoading: isDashboardsLoading,
    error: dashboardsError,
  } = useQuery<Dashboard[]>({
    queryKey: ["dashboards"],
    queryFn: async () => {
      const response = await fetch("/api/dashboards");
      if (!response.ok) throw new Error("Failed to fetch dashboards");
      return response.json();
    },
  });

  // Fetch specific dashboard
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useQuery<Dashboard>({
    queryKey: ["dashboard", dashboardId],
    queryFn: async () => {
      if (!dashboardId) throw new Error("No dashboard ID provided");
      const response = await fetch(`/api/dashboards/${dashboardId}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
    enabled: !!dashboardId,
  });

  // Real-time auto-save mutation for layout
  const layoutMutation = useMutation({
    mutationFn: async ({
      id,
      layout,
    }: {
      id: string;
      layout: DashboardLayout;
    }) => {
      const response = await fetch(`/api/dashboards/${id}/layout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (!response.ok) throw new Error("Failed to save layout");
      return response.json();
    },
    // Optimistic update for instant feedback
    onMutate: async ({ id, layout }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["dashboard", id] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Dashboard>(["dashboard", id]);

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<Dashboard>(["dashboard", id], {
          ...previous,
          layout,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previous };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["dashboard", variables.id],
          context.previous
        );
      }
    },
    // Refetch on success to ensure consistency
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", variables.id] });
    },
  });

  // Debounced auto-save function
  const saveLayout = useCallback(
    (id: string, layout: DashboardLayout) => {
      layoutMutation.mutate({ id, layout });
    },
    [layoutMutation]
  );

  return {
    // All dashboards
    dashboards,
    isDashboardsLoading,
    dashboardsError,

    // Current dashboard
    dashboard,
    isDashboardLoading,
    dashboardError,

    // Layout auto-save
    saveLayout,
    isSavingLayout: layoutMutation.isPending,
    layoutSaveError: layoutMutation.error,
  };
}
