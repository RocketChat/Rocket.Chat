import { MockedModalContext } from '@rocket.chat/mock-providers/src/MockedModalContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

import CurrentChatsPage from './CurrentChatsPage';

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
	const { container } = render(<CurrentChatsPage onRowClick={() => undefined} />, {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedModalContext>{children}</MockedModalContext>
			</QueryClientProvider>
		),
	});

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
