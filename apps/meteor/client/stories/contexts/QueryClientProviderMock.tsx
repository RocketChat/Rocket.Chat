import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { FC } from 'react';

const queryCache = new QueryCache();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			cacheTime: Infinity,
		},
	},
	queryCache,
});

const QueryClientProviderMock: FC = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

export default QueryClientProviderMock;
