import { MockedModalContext } from '@rocket.chat/mock-providers/src/MockedModalContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import HighContrastUpsellModal from './HighContrastUpsellModal';

expect.extend(toHaveNoViolations);

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});

it('should have no a11y violations', async () => {
	const { container } = render(<HighContrastUpsellModal onClose={() => undefined} />, {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (args) => {
						if (args.method === 'GET' && args.pathPattern === '/v1/licenses.isEnterprise') {
							return {
								isEnterprise: true,
							} as any;
						}
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedModalContext>{children}</MockedModalContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
