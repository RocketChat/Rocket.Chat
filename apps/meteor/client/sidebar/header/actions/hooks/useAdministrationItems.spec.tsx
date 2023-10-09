import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react-hooks';

import { useAdministrationItems } from './useAdministrationItems';

const LICENSE_INFO_PAYLOAD = {
	data: {
		license: {
			version: '3.0',
			information: {
				autoRenew: false,
				visualExpiration: '0001-01-01T00:00:00.000Z',
				trial: false,
				offline: false,
				createdAt: '2023-10-09T17:25:54.828Z',
				grantedBy: {
					method: 'manual',
					seller: 'V2',
				},
				tags: [
					{
						name: 'Pro',
						color: '#F3BE08',
					},
				],
			},
			validation: {
				serverUrls: [
					{
						value: 'localhost:3000',
						type: 'regex',
					},
				],
				validPeriods: [
					{
						validUntil: '2023-11-17T00:00:00.000Z',
						invalidBehavior: 'invalidate_license',
					},
				],
				statisticsReport: {
					required: true,
				},
			},
			grantedModules: [],
			limits: {
				activeUsers: [
					{
						max: 25,
						behavior: 'prevent_action',
					},
				],
			},
			cloudMeta: {
				trial: false,
				trialEnd: '0001-01-01T00:00:00Z',
				workspaceId: '651c4519f712c20001151d0a',
			},
		},
		activeModules: [],
		limits: {
			activeUsers: {
				value: 10,
				max: 25,
			},
		},
	},
	success: true,
};

it('should not show upgrade item if has license and not have trial', async () => {
	const license = { ...LICENSE_INFO_PAYLOAD, data: { ...LICENSE_INFO_PAYLOAD.data, activeModules: ['testModules'] } };
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => license as any)
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
});

it('should return an upgrade item if not have license or if have a trial', async () => {
	const { result, waitFor } = renderHook(() => useAdministrationItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/licenses.info', () => LICENSE_INFO_PAYLOAD as any)
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
			.withEndpoint('GET', '/v1/licenses.info', () => LICENSE_INFO_PAYLOAD as any)
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
			.withEndpoint('GET', '/v1/licenses.info', () => LICENSE_INFO_PAYLOAD as any)
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
