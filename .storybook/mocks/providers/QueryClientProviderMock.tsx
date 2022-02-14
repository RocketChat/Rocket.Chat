import React, { FC } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query';

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
