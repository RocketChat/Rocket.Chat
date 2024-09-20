import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';

const queryCache = new QueryCache();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			cacheTime: Infinity,
			refetchOnWindowFocus: false,
		},
	},
	queryCache,
});

type QueryClientProviderMockProps = {
	children?: ReactNode;
};

const QueryClientProviderMock = ({ children }: QueryClientProviderMockProps) => (
	<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export default QueryClientProviderMock;
