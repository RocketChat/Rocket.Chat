import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react-hooks';

import { useAdministrationItems } from './useAdministrationItems';

it('should not show upgrade item if has license and not have trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				license: {
					// @ts-expect-error this is a mock
					license: { activeModules: ['testModule'] },
					trial: false,
				},
			}))
			.withEndpoint('GET', '/v1/cloud.registrationStatus', () => ({
				registrationStatus: {
					workspaceRegistered: false,
				} as any,
			}))
			.withPermission('view-privileged-setting')
			.withPermission('manage-cloud')
			.build(),
	});

	await waitFor(() => !!(result.all.length > 1));
	expect(result.current.length).toEqual(1);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'workspace',
		}),
	);
});

it('should return an upgrade item if not have license or if have a trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				// @ts-expect-error this is a mock
				license: {},
			}))
			.withEndpoint('GET', '/v1/cloud.registrationStatus', () => ({
				registrationStatus: {
					workspaceRegistered: false,
				} as any,
			}))
			.withPermission('view-privileged-setting')
			.withPermission('manage-cloud')
			.build(),
	});

	// Workspace admin is also expected to be here
	await waitFor(() => result.current.length > 1);

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'showUpgradeItem',
		}),
	);
});

it('should return omnichannel item if has `view-livechat-manager` permission ', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				// @ts-expect-error this is a mock
				license: {},
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
			.withEndpoint('GET', '/v1/licenses.info', () => ({
				// @ts-expect-error this is a mock
				license: {},
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
