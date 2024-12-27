import type { DefaultError, Query } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { dispatchToastMessage } from '../../lib/toast';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			gcTime: Infinity,
			refetchOnWindowFocus: false,
		},
	},
});

type QueryClientProviderMockProps = {
	children?: ReactNode;
};

const QueryClientProviderMock = ({ children }: QueryClientProviderMockProps) => {
	const queryCacheInstance = queryClient.getQueryCache();

	queryCacheInstance.config.onError = (error: DefaultError, query: Query<unknown, unknown, unknown>) => {
		const { errorToastMessage, apiErrorToastMessage } = query?.meta as { errorToastMessage?: string; apiErrorToastMessage?: boolean };
		if (apiErrorToastMessage) {
			dispatchToastMessage({ type: 'error', message: error });
		} else if (errorToastMessage) {
			dispatchToastMessage({ type: 'error', message: errorToastMessage });
		}
	};

	queryCacheInstance.config.onSuccess = (_, query: Query<unknown, unknown, unknown>) => {
		const { successToastMessage } = query?.meta as { successToastMessage?: string };
		if (successToastMessage) {
			dispatchToastMessage({ type: 'success', message: successToastMessage });
		}
	};

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryClientProviderMock;
