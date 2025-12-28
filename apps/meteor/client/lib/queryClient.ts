import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: process.env.TEST_MODE === 'true',
		},
		mutations: {
			onError: console.warn,
		},
	},
});
