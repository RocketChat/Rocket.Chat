import { MockedAuthorizationContext } from '@rocket.chat/mock-providers/src/MockedAuthorizationContext';
import { MockedModalContext } from '@rocket.chat/mock-providers/src/MockedModalContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { useAdministrationItems } from './useAdministrationItems';

const queryClient = new QueryClient({
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

it('should not show upgrade item if has license and not have trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (args) => {
						if (args.method === 'GET' && args.pathPattern === '/v1/licenses.get') {
							return {
								licenses: [
									{
										modules: ['testModule'],
										meta: { trial: false },
									},
								],
							} as any;
						}

						if (args.method === 'GET' && args.pathPattern === '/v1/cloud.registrationStatus') {
							return {
								registrationStatus: {
									workspaceRegistered: false,
								},
							};
						}
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={[]}>
								<MockedModalContext>{children}</MockedModalContext>
							</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.all.length > 1));
	expect(result.current).toEqual([]);
});

it('should return an upgrade item if not have license or if have a trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (args) => {
						if (args.method === 'GET' && args.pathPattern === '/v1/licenses.get') {
							return {
								licenses: [
									{
										modules: [],
									},
								],
							} as any;
						}

						if (args.method === 'GET' && args.pathPattern === '/v1/cloud.registrationStatus') {
							return {
								registrationStatus: {
									workspaceRegistered: false,
								},
							};
						}
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={[]}>
								<MockedModalContext>{children}</MockedModalContext>
							</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => {
		return !queryClient.isFetching();
	});

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'showUpgradeItem',
		}),
	);
});

it('should return omnichannel item if has `view-livechat-manager` permission ', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (args) => {
						if (args.method === 'GET' && args.pathPattern === '/v1/licenses.get') {
							return {
								licenses: [
									{
										modules: [],
									},
								],
							} as any;
						}

						if (args.method === 'GET' && args.pathPattern === '/v1/cloud.registrationStatus') {
							return {
								registrationStatus: {
									workspaceRegistered: false,
								},
							};
						}
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['view-livechat-manager']}>
								<MockedModalContext>{children}</MockedModalContext>
							</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.length));
	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'omnichannel',
		}),
	);
});

it('should show administration item if has at least one admin permission', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (args) => {
						if (args.method === 'GET' && args.pathPattern === '/v1/licenses.get') {
							return {
								licenses: [
									{
										modules: [],
									},
								],
							} as any;
						}

						if (args.method === 'GET' && args.pathPattern === '/v1/cloud.registrationStatus') {
							return {
								registrationStatus: {
									workspaceRegistered: false,
								},
							};
						}
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['access-permissions']}>
								<MockedModalContext>{children}</MockedModalContext>
							</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.length));
	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'workspace',
		}),
	);
});
