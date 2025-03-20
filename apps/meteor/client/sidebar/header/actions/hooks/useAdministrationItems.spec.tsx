import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useAdministrationItems } from './useAdministrationItems';

it('should return omnichannel item if has `view-livechat-manager` permission ', async () => {
	const { result } = renderHook(() => useAdministrationItems(), {
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
	const { result } = renderHook(() => useAdministrationItems(), {
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
