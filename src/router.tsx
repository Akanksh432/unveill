import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let _router: ReturnType<typeof createRouter> | undefined;

export const getRouter = () => {
  if (!_router) {
    const queryClient = new QueryClient();
    _router = createRouter({
      routeTree,
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
    });
  }
  return _router;
};
