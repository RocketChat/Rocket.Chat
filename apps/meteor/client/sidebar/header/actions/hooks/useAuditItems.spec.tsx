import { MockedAuthorizationContext } from '@rocket.chat/mock-providers/src/MockedAuthorizationContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { useAuditItems } from './useAuditItems';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});

it('should return an empty array if doesn`t have license', async () => {
	const { result, waitFor } = renderHook(() => useAuditItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleMethod={(methodName, ..._) => {
						if (methodName === 'license:getModules') {
							return [] as any;
						}

						throw new Error('Method not mocked');
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit', 'can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.all.length > 1));
	expect(result.current).toEqual([]);
});

it('should return an empty array if have license and not have permissions', async () => {
	const { result, waitFor } = renderHook(() => useAuditItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleMethod={(methodName, ..._) => {
						if (methodName === 'license:getModules') {
							return ['auditing'] as any;
						}

						throw new Error('Method not mocked');
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

	await waitFor(() => Boolean(result.all.length > 1));
	expect(result.current).toEqual([]);
});

it('should return auditItems if have license and permissions', async () => {
	const { result, waitFor } = renderHook(() => useAuditItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleMethod={(methodName, ..._) => {
						if (methodName === 'license:getModules') {
							return ['auditing'] as any;
						}

						throw new Error('Method not mocked');
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit', 'can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.length));
	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'messages',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'auditLog',
		}),
	);
});

it('should return auditMessages item if have license and can-audit permission', async () => {
	const { result, waitFor } = renderHook(() => useAuditItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleMethod={(methodName, ..._) => {
						if (methodName === 'license:getModules') {
							return ['auditing'] as any;
						}

						throw new Error('Method not mocked');
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.length));
	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'messages',
		}),
	);
});

it('should return audiLogs item if have license and can-audit-log permission', async () => {
	const { result, waitFor } = renderHook(() => useAuditItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleMethod={(methodName, ..._) => {
						if (methodName === 'license:getModules') {
							return ['auditing'] as any;
						}

						throw new Error('Method not mocked');
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.length));
	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'auditLog',
		}),
	);
});
