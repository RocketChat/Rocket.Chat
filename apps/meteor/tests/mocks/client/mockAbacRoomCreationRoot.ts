import { mockAppRoot } from '@rocket.chat/mock-providers';

import { createFakeLicenseInfo } from '../data';

export type AbacRoomCreationRootOptions = {
	enforced?: boolean;
	requiredAttributes?: string[];
	assignable?: { key: string; values: string[] }[];
	permissions?: string[];
	config?: () => unknown;
};

export const mockAbacRoomCreationRoot = ({
	enforced = false,
	requiredAttributes = [],
	assignable = [{ key: 'dept', values: ['eng', 'sales'] }],
	permissions = ['create-abac-managed-room', 'create-c', 'create-p', 'create-team'],
	config = () => ({ bannersConfig: '', requiredAttributes }),
}: AbacRoomCreationRootOptions = {}) =>
	permissions
		.reduce(
			(root, permission) => root.withPermission(permission),
			mockAppRoot()
				.withJohnDoe()
				.withSetting('ABAC_Enabled', true)
				.withSetting('ABAC_Enforce_All_Rooms', enforced)
				.withSetting('UTF8_Channel_Names_Validation', '[0-9a-zA-Z-_.]+')
				.withTranslations('en', 'core', { Step_of_total: 'Step {{step}} of {{total}}' })
				.withEndpoint(
					'GET',
					'/v1/licenses.info',
					jest.fn().mockImplementation(() => ({ license: createFakeLicenseInfo({ activeModules: ['abac'] }) })),
				)
				.withEndpoint('GET', '/v1/abac/config', jest.fn().mockImplementation(config))
				.withEndpoint(
					'GET',
					'/v1/abac/assignable-attributes',
					jest.fn().mockImplementation(() => ({ attributes: assignable })),
				)
				.withEndpoint(
					'GET',
					'/v1/rooms.nameExists',
					jest.fn().mockImplementation(() => ({ exists: false })),
				),
		)
		.build();
