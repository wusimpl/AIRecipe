"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryClientWrapper = ({ children }: QueryProviderProps) => {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 默认5分钟内不重新请求
            gcTime: 10 * 60 * 1000, // 缓存保持10分钟
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
