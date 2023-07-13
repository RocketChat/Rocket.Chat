/* eslint-disable react/no-multi-comp */
import { MockedAuthorizationContext } from '@rocket.chat/mock-providers/src/MockedAuthorizationContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClient } from '@tanstack/react-query';
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
				<MockedServerContext>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
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
				<MockedServerContext>
					<MockedAuthorizationContext permissions={['access-marketplace']}>
						<MockedSettingsContext settings={{}}>
							<MockedUserContext userPreferences={{}}>
								<MockedUiKitActionManager>{children}</MockedUiKitActionManager>
							</MockedUserContext>
						</MockedSettingsContext>
					</MockedAuthorizationContext>
				</MockedServerContext>
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
				<MockedServerContext
					handleRequest={async (args) => {
						if (args.method === 'GET' && args.pathPattern === '/apps/app-request/stats') {
							return {
								totalSeen: 0,
								totalUnseen: 1,
							} as any;
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
