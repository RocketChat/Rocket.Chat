import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			onError: console.warn,
			refetchOnWindowFocus: false,
		},
		mutations: {
			onError: console.warn,
		},
	},
});
