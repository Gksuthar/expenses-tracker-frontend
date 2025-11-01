import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios-client";

export const useAllTasks = (workspaceId: string) =>
  useQuery({
    queryKey: ["allTasks", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await API.get(`/task/workspace/${workspaceId}/all`);
      return data;
    },
    enabled: !!workspaceId,
  });
