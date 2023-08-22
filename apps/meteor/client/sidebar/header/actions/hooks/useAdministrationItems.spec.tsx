import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react-hooks';

import { useAdministrationItems } from './useAdministrationItems';

it('should not show upgrade item if has license and not have trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.get', () => ({
				licenses: [
					{
						modules: ['testModule'],
						meta: { trial: false },
					} as any,
				],
			}))
			.withEndpoint('GET', '/v1/cloud.registrationStatus', () => ({
				registrationStatus: {
					workspaceRegistered: false,
				} as any,
			}))
			.build(),
	});

	await waitFor(() => !!(result.all.length > 1));

	expect(result.current).toEqual([]);
});

it('should return an upgrade item if not have license or if have a trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.get', () => ({
				licenses: [
					{
						modules: [],
					} as any,
				],
			}))
			.withEndpoint('GET', '/v1/cloud.registrationStatus', () => ({
				registrationStatus: {
					workspaceRegistered: false,
				} as any,
			}))
			.build(),
	});

	await waitFor(() => !!result.current[0]);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'showUpgradeItem',
		}),
	);
});

it('should return omnichannel item if has `view-livechat-manager` permission ', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.get', () => ({
				licenses: [
					{
						modules: [],
					} as any,
				],
			}))
			.withEndpoint('GET', '/v1/cloud.registrationStatus', () => ({
				registrationStatus: {
					workspaceRegistered: false,
				} as any,
			}))
			.withPermission('view-livechat-manager')
			.build(),
	});

	await waitFor(() => !!result.current.length);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'omnichannel',
		}),
	);
});

it('should show administration item if has at least one admin permission', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.get', () => ({
				licenses: [
					{
						modules: [],
					} as any,
				],
			}))
			.withEndpoint('GET', '/v1/cloud.registrationStatus', () => ({
				registrationStatus: {
					workspaceRegistered: false,
				} as any,
			}))
			.withPermission('access-permissions')
			.build(),
	});

	await waitFor(() => !!result.current.length);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'workspace',
		}),
	);
});
