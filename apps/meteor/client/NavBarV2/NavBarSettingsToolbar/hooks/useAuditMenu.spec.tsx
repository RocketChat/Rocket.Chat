import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useAuditMenu } from './useAuditMenu';

it('should return an empty array of items if doesn`t have license', async () => {
	const { result } = renderHook(() => useAuditMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				// @ts-expect-error: just for testing
				license: {
					activeModules: [],
				},
			}))
			.withJohnDoe()
			.withPermission('can-audit')
			.withPermission('can-audit-log')
			.build(),
	});

	await waitFor(() => expect(result.current.items).toEqual([]));
});

it('should return an empty array of items if have license and not have permissions', async () => {
	const { result } = renderHook(() => useAuditMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				license: {
					license: {
						// @ts-expect-error: just for testing
						grantedModules: [{ module: 'auditing' }],
					},
					// @ts-expect-error: just for testing
					activeModules: ['auditing'],
				},
			}))
			.withMethod('license:getModules', () => ['auditing'])
			.withJohnDoe()
			.build(),
	});

	await waitFor(() => expect(result.current.items).toEqual([]));
});

it('should return auditItems if have license and permissions', async () => {
	const { result } = renderHook(() => useAuditMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				license: {
					license: {
						// @ts-expect-error: just for testing
						grantedModules: [{ module: 'auditing' }],
					},
					// @ts-expect-error: just for testing
					activeModules: ['auditing'],
				},
			}))
			.withJohnDoe()
			.withPermission('can-audit')
			.withPermission('can-audit-log')
			.build(),
	});

	await waitFor(() =>
		expect(result.current.items[0]).toEqual(
			expect.objectContaining({
				id: 'messages',
			}),
		),
	);

	expect(result.current.items[1]).toEqual(
		expect.objectContaining({
			id: 'auditLog',
		}),
	);
});

it('should return auditMessages item if have license and can-audit permission', async () => {
	const { result } = renderHook(() => useAuditMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				license: {
					license: {
						// @ts-expect-error: just for testing
						grantedModules: [{ module: 'auditing' }],
					},
					// @ts-expect-error: just for testing
					activeModules: ['auditing'],
				},
			}))
			.withJohnDoe()
			.withPermission('can-audit')
			.build(),
	});

	await waitFor(() =>
		expect(result.current.items[0]).toEqual(
			expect.objectContaining({
				id: 'messages',
			}),
		),
	);
});

it('should return audiLogs item if have license and can-audit-log permission', async () => {
	const { result } = renderHook(() => useAuditMenu(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				license: {
					license: {
						// @ts-expect-error: just for testing
						grantedModules: [{ module: 'auditing' }],
					},
					// @ts-expect-error: just for testing
					activeModules: ['auditing'],
				},
			}))
			.withJohnDoe()
			.withPermission('can-audit-log')
			.build(),
	});

	await waitFor(() =>
		expect(result.current.items[0]).toEqual(
			expect.objectContaining({
				id: 'auditLog',
			}),
		),
	);
});
