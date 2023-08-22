import { MockedModalContext } from '@rocket.chat/mock-providers/src/MockedModalContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React from 'react';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});

beforeEach(() => {
	queryClient.clear();
});

export const ProviderMockProvider = ({ children, isEnterprise }: { children: React.ReactNode; isEnterprise: boolean }) => (
	<QueryClientProvider client={queryClient}>
		<MockedServerContext isEnterprise={isEnterprise}>
			<MockedSettingsContext settings={{}}>
				<MockedUserContext userPreferences={{}}>
					<MockedModalContext>{children}</MockedModalContext>
				</MockedUserContext>
			</MockedSettingsContext>
		</MockedServerContext>
	</QueryClientProvider>
);
