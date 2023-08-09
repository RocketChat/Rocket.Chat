import { MockedAuthorizationContext } from '@rocket.chat/mock-providers/src/MockedAuthorizationContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { ActionManagerContext } from '../../../../contexts/ActionManagerContext';
import { useAppsItems } from './useAppsItems';

it('should return and empty array if the user does not have `manage-apps` and `access-marketplace` permission', () => {
	const { result } = renderHook(
		() => {
			return useAppsItems();
		},
		{
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					<MockedServerContext
						handleRequest={(args) => {
							if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
								return [] as any;
							}
						}}
					>
						<MockedSettingsContext settings={{}}>
							<MockedUserContext userPreferences={{}}>
								<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
							</MockedUserContext>
						</MockedSettingsContext>
					</MockedServerContext>
				</QueryClientProvider>
			),
		},
	);

	expect(result.all[0]).toEqual([]);
});

it('should return `marketplace` and `installed` items if the user has `access-marketplace` permission', () => {
	const { result } = renderHook(
		() => {
			return useAppsItems();
		},
		{
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					<MockedServerContext
						handleRequest={(args) => {
							if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
								return [] as any;
							}
						}}
					>
						<MockedAuthorizationContext permissions={['access-marketplace']}>
							<MockedSettingsContext settings={{}}>
								<MockedUserContext userPreferences={{}}>
									<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
								</MockedUserContext>
							</MockedSettingsContext>
						</MockedAuthorizationContext>
					</MockedServerContext>
				</QueryClientProvider>
			),
		},
	);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'marketplace',
		}),
	);
	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);
});

it('should return `marketplace` and `installed` items if the user has `manage-apps` permission', () => {
	const { result } = renderHook(
		() => {
			return useAppsItems();
		},
		{
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					<MockedServerContext
						handleRequest={async (args) => {
							if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
								return {
									data: {
										totalSeen: 0,
										totalUnseen: 1,
									},
								} as any;
							}
							if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
								return [] as any;
							}

							throw new Error('Method not mocked');
						}}
					>
						<MockedAuthorizationContext permissions={['manage-apps']}>
							<MockedSettingsContext settings={{}}>
								<MockedUserContext userPreferences={{}}>
									<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
								</MockedUserContext>
							</MockedSettingsContext>
						</MockedAuthorizationContext>
					</MockedServerContext>
				</QueryClientProvider>
			),
		},
	);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'marketplace',
		}),
	);
	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);

	expect(result.current[2]).toEqual(
		expect.objectContaining({
			id: 'requested-apps',
		}),
	);
});

it('should return one action from the server with no conditions', async () => {
	const { result, waitForValueToChange } = renderHook(
		() => {
			return useAppsItems();
		},
		{
			wrapper: ({ children }) => (
				<QueryClientProvider client={queryClient}>
					<MockedServerContext
						handleRequest={async (args) => {
							if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
								return {
									data: {
										totalSeen: 0,
										totalUnseen: 1,
									},
								} as any;
							}
							if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
								return [
									{
										appId: 'APP_ID',
										actionId: 'ACTION_ID',
										labelI18n: 'LABEL_I18N',
										context: 'userDropdownAction',
									},
								] as any;
							}

							throw new Error('Method not mocked');
						}}
					>
						<MockedAuthorizationContext permissions={['manage-apps']}>
							<MockedSettingsContext settings={{}}>
								<MockedUserContext userPreferences={{}}>
									<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
								</MockedUserContext>
							</MockedSettingsContext>
						</MockedAuthorizationContext>
					</MockedServerContext>
				</QueryClientProvider>
			),
		},
	);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'marketplace',
		}),
	);
	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);

	await waitForValueToChange(() => result.current[3]);

	expect(result.current[3]).toEqual(
		expect.objectContaining({
			id: 'APP_ID_ACTION_ID',
		}),
	);
});

describe('User Dropdown actions with role conditions', () => {
	it('should return the action if the user has admin role', async () => {
		const { result, waitForValueToChange } = renderHook(
			() => {
				return useAppsItems();
			},
			{
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>
						<MockedServerContext
							handleRequest={async (args) => {
								if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
									return {
										data: {
											totalSeen: 0,
											totalUnseen: 1,
										},
									} as any;
								}
								if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
									return [
										{
											appId: 'APP_ID',
											actionId: 'ACTION_ID',
											labelI18n: 'LABEL_I18N',
											context: 'userDropdownAction',
											when: {
												hasOneRole: ['admin'],
											},
										},
									] as any;
								}

								throw new Error('Method not mocked');
							}}
						>
							<MockedAuthorizationContext permissions={['manage-apps']} roles={['admin']}>
								<MockedSettingsContext settings={{}}>
									<MockedUserContext userPreferences={{}}>
										<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
									</MockedUserContext>
								</MockedSettingsContext>
							</MockedAuthorizationContext>
						</MockedServerContext>
					</QueryClientProvider>
				),
			},
		);

		await waitForValueToChange(() => {
			return queryClient.isFetching();
		});

		expect(result.current[0]).toEqual(
			expect.objectContaining({
				id: 'marketplace',
			}),
		);
		expect(result.current[1]).toEqual(
			expect.objectContaining({
				id: 'installed',
			}),
		);

		expect(result.current[3]).toEqual(
			expect.objectContaining({
				id: 'APP_ID_ACTION_ID',
			}),
		);
	});

	it('should return filter the action if the user doesn`t have admin role', async () => {
		const { result, waitForValueToChange } = renderHook(
			() => {
				return useAppsItems();
			},
			{
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>
						<MockedServerContext
							handleRequest={async (args) => {
								if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
									return {
										data: {
											totalSeen: 0,
											totalUnseen: 1,
										},
									} as any;
								}
								if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
									return [
										{
											appId: 'APP_ID',
											actionId: 'ACTION_ID',
											labelI18n: 'LABEL_I18N',
											context: 'userDropdownAction',
											when: {
												hasOneRole: ['admin'],
											},
										},
									] as any;
								}

								throw new Error('Method not mocked');
							}}
						>
							<MockedAuthorizationContext permissions={['manage-apps']}>
								<MockedSettingsContext settings={{}}>
									<MockedUserContext userPreferences={{}}>
										<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
									</MockedUserContext>
								</MockedSettingsContext>
							</MockedAuthorizationContext>
						</MockedServerContext>
					</QueryClientProvider>
				),
			},
		);

		await waitForValueToChange(() => {
			return queryClient.isFetching();
		});

		expect(result.current[0]).toEqual(
			expect.objectContaining({
				id: 'marketplace',
			}),
		);
		expect(result.current[1]).toEqual(
			expect.objectContaining({
				id: 'installed',
			}),
		);

		expect(result.current[2]).toEqual(
			expect.objectContaining({
				id: 'requested-apps',
			}),
		);

		expect(result.current[3]).toEqual(undefined);
	});
});

describe('User Dropdown actions with permission conditions', () => {
	it('should return the action if the user has manage-apps permission', async () => {
		const { result, waitForValueToChange } = renderHook(
			() => {
				return useAppsItems();
			},
			{
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>
						<MockedServerContext
							handleRequest={async (args) => {
								if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
									return {
										data: {
											totalSeen: 0,
											totalUnseen: 1,
										},
									} as any;
								}
								if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
									return [
										{
											appId: 'APP_ID',
											actionId: 'ACTION_ID',
											labelI18n: 'LABEL_I18N',
											context: 'userDropdownAction',
											when: {
												hasOnePermission: ['manage-apps'],
											},
										},
									] as any;
								}

								throw new Error('Method not mocked');
							}}
						>
							<MockedAuthorizationContext permissions={['manage-apps']}>
								<MockedSettingsContext settings={{}}>
									<MockedUserContext userPreferences={{}}>
										<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
									</MockedUserContext>
								</MockedSettingsContext>
							</MockedAuthorizationContext>
						</MockedServerContext>
					</QueryClientProvider>
				),
			},
		);

		await waitForValueToChange(() => {
			return queryClient.isFetching();
		});

		expect(result.current[0]).toEqual(
			expect.objectContaining({
				id: 'marketplace',
			}),
		);
		expect(result.current[1]).toEqual(
			expect.objectContaining({
				id: 'installed',
			}),
		);

		expect(result.current[3]).toEqual(
			expect.objectContaining({
				id: 'APP_ID_ACTION_ID',
			}),
		);
	});

	it('should return filter the action if the user doesn`t have `any` permission', async () => {
		const { result, waitForValueToChange } = renderHook(
			() => {
				return useAppsItems();
			},
			{
				wrapper: ({ children }) => (
					<QueryClientProvider client={queryClient}>
						<MockedServerContext
							handleRequest={async (args) => {
								if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
									return {
										data: {
											totalSeen: 0,
											totalUnseen: 1,
										},
									} as any;
								}
								if (args.method === 'GET' && args.pathPattern === '/apps/actionButtons') {
									return [
										{
											appId: 'APP_ID',
											actionId: 'ACTION_ID',
											labelI18n: 'LABEL_I18N',
											context: 'userDropdownAction',
											when: {
												hasOnePermission: ['any'],
											},
										},
									] as any;
								}

								throw new Error('Method not mocked');
							}}
						>
							<MockedAuthorizationContext permissions={['manage-apps']}>
								<MockedSettingsContext settings={{}}>
									<MockedUserContext userPreferences={{}}>
										<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
									</MockedUserContext>
								</MockedSettingsContext>
							</MockedAuthorizationContext>
						</MockedServerContext>
					</QueryClientProvider>
				),
			},
		);

		await waitForValueToChange(() => {
			return queryClient.isFetching();
		});

		expect(result.current[3]).toEqual(undefined);
	});
});

export const MockedUiKitActionManager = ({ children }: { children: React.ReactNode }) => {
	return <ActionManagerContext.Provider value={{} as any}>{children}</ActionManagerContext.Provider>;
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});
afterEach(() => {
	queryClient.clear();
});
