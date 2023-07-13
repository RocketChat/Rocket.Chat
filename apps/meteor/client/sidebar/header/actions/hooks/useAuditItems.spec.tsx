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

// it('should return an empty array if not have license', () => {
// 	const { result } = renderHook(() => useAuditItems(), {
// 		wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
// 	});

// 	expect(result.all[0]).toEqual([]);
// });

// it('should return an empty array if have license and not have permissions', () => {
// 	const { result } = renderHook(() => useAuditItems(), {
// 		wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
// 	});

// 	expect(result.all[0]).toEqual([]);
// });

it('should return auditItems if have license and permissions', () => {
	const { result } = renderHook(() => useAuditItems(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleMethod={(methodName) => {
						if (methodName === 'license:getModules') {
							console.log('entrei');
							return true;
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

	console.log(result.current);
	expect(result.current).toHaveLength(2);
});

// it('should return an empty array if don`t have permission can-audit && can-audit-log', () => {});
