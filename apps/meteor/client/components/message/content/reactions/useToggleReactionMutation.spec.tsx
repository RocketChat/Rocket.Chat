import { MockedAuthorizationContext } from '@rocket.chat/mock-providers/src/MockedAuthorizationContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';

import { useToggleReactionMutation } from './useToggleReactionMutation';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
	logger: {
		log: (..._) => {
			// Log debugging information
		},
		warn: (..._) => {
			// Log warning
		},
		error: (..._) => {
			// Log error
		},
	},
});

beforeEach(() => {
	queryClient.clear();
});

it('should be call rest `POST /v1/chat.react` method', async () => {
	const fn = jest.fn();
	const { result, waitFor } = renderHook(() => useToggleReactionMutation(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={({ method, pathPattern, params }) => {
						if (method === 'POST' && pathPattern === '/v1/chat.react') {
							fn(params);
							return { success: true } as any;
						}

						throw new Error(`Endpoint not mocked: ${method} ${pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={[]}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await act(async () => {
		await result.current.mutateAsync({ mid: 'MID', reaction: 'smile' });
	});

	await waitFor(() => result.current.isLoading === false);

	expect(fn).toHaveBeenCalledWith({
		messageId: 'MID',
		reaction: 'smile',
	});
});

it('should not work for non-logged in users', async () => {
	const fn = jest.fn();
	const { result, waitForValueToChange } = renderHook(() => useToggleReactionMutation(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={({ method, pathPattern, params }) => {
						if (method === 'POST' && pathPattern === '/v1/chat.react') {
							fn(params);
							return { success: true } as any;
						}

						throw new Error(`Endpoint not mocked: ${method} ${pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedAuthorizationContext permissions={[]}>{children}</MockedAuthorizationContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	act(() => {
		return result.current.mutate({ mid: 'MID', reaction: 'smile' });
	});

	await waitForValueToChange(() => result.current.status);

	expect(fn).not.toHaveBeenCalled();

	expect(result.current.status).toBe('error');

	expect(result.current.error).toEqual(new Error('Not logged in'));
});
