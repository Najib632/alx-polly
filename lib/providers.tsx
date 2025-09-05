"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { JSX, useState } from "react";

/**
 * A provider component that sets up the TanStack Query client.
 * This component should wrap the root of the application to make the query client
 * available to all child components.
 *
 * It initializes a new QueryClient instance and provides it to the application.
 * It also includes the ReactQueryDevtools for debugging purposes, which are
 * only active in development environments.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered.
 * @returns {JSX.Element} The QueryClientProvider wrapping the application.
 */
export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // Using useState to hold the query client instance ensures that it is created
  // only once per component lifecycle.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
