import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

export const MockedQueryClientWrapper = () => {
	const queryClient = new QueryClient();
	const provider = ({ children }: any) => {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
	provider.displayName = 'provider';

	return provider;
};
