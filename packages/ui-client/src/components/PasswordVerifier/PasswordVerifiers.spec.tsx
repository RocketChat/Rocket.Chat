import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';

import { PasswordVerifier } from './PasswordVerifier';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (str: string) => str,
		i18n: {
			changeLanguage: () => new Promise(() => undefined),
		},
	}),
}));

afterEach(() => {
	queryClient.clear();
});

it('should render no policy if its disabled ', () => {
	const { container } = render(
		<MockedServerContext
			handleRequest={(request) => {
				if (request.method === 'GET' && request.pathPattern === '/v1/pw.getPolicy') {
					return {
						enabled: false,
						policy: [],
					} as any;
				}
				throw new Error('Not implemented');
			}}
		>
			<PasswordVerifier password='' />
		</MockedServerContext>,
	);

	expect(container.firstChild).toBeNull();
});

it('should render no policy if its enabled but empty', () => {
	const { container } = render(
		<MockedServerContext
			handleRequest={(request) => {
				if (request.method === 'GET' && request.pathPattern === '/v1/pw.getPolicy') {
					return {
						enabled: true,
						policy: [],
					} as any;
				}
				throw new Error('Not implemented');
			}}
		>
			<PasswordVerifier password='' />
		</MockedServerContext>,
	);

	expect(container.firstChild).toBeNull();
});

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});

it("should render policy as invalid if password doesn't match the requirements", async () => {
	const { getByText } = render(
		<QueryClientProvider client={queryClient}>
			<MockedServerContext
				handleRequest={(request) => {
					if (request.method === 'GET' && request.pathPattern === '/v1/pw.getPolicy') {
						return {
							enabled: true,
							policy: [['get-password-policy-minLength', { minLength: 10 }]],
						} as any;
					}
					throw new Error('Not implemented');
				}}
			>
				<PasswordVerifier password='asd' />
			</MockedServerContext>
		</QueryClientProvider>,
	);

	await waitFor(() => {
		expect(getByText('get-password-policy-minLength-label').parentElement?.dataset.invalid).toBe('true');
	});
});

it('should render policy as valid if password match the requirements', async () => {
	const { getByText } = render(
		<QueryClientProvider client={queryClient}>
			<MockedServerContext
				handleRequest={(request) => {
					if (request.method === 'GET' && request.pathPattern === '/v1/pw.getPolicy') {
						return {
							enabled: true,
							policy: [['get-password-policy-minLength', { minLength: 2 }]],
						} as any;
					}
					throw new Error('Not implemented');
				}}
			>
				<PasswordVerifier password='asd' />
			</MockedServerContext>
		</QueryClientProvider>,
	);

	await waitFor(() => {
		expect(getByText('get-password-policy-minLength-label').parentElement?.dataset.invalid).toBe(undefined);
	});
});
