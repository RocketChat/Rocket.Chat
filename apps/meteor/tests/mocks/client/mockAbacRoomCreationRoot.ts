import { mockAppRoot } from '@rocket.chat/mock-providers';

import { createFakeLicenseInfo } from '../data';

export type AbacRoomCreationRootOptions = {
	enforced?: boolean;
	federation?: boolean;
	requiredAttributes?: string[];
	assignable?: { key: string; values: string[] }[];
	permissions?: string[];
	assignableAttributes?: () => unknown;
	membershipPreview?: () => unknown;
	createTeam?: () => unknown;
};

export const mockAbacRoomCreationRoot = ({
	enforced = false,
	federation = false,
	requiredAttributes = [],
	assignable = [{ key: 'dept', values: ['eng', 'sales'] }],
	permissions = ['create-abac-managed-room', 'create-c', 'create-p', 'create-team'],
	assignableAttributes = () => ({ attributes: assignable, requiredKeys: requiredAttributes }),
	membershipPreview = () => ({
		compliant: [{ _id: 'john.doe', username: 'john.doe', name: 'John Doe' }],
		nonCompliant: [],
		inconclusive: [],
		creator: 'compliant',
	}),
	createTeam = () => ({ team: { roomId: 'team-room' } }),
}: AbacRoomCreationRootOptions = {}) =>
	[...permissions, ...(federation ? ['access-federation'] : [])]
		.reduce(
			(root, permission) => root.withPermission(permission),
			mockAppRoot()
				.withJohnDoe()
				.withSetting('ABAC_Enabled', true)
				.withSetting('ABAC_Enforce_All_Rooms', enforced)
				.withSetting('Federation_Matrix_enabled', federation)
				.withSetting('UTF8_Channel_Names_Validation', '[0-9a-zA-Z-_.]+')
				.withTranslations('en', 'core', { Step_of_total: 'Step {{step}} of {{total}}' })
				.withEndpoint(
					'GET',
					'/v1/licenses.info',
					jest.fn().mockImplementation(() => ({
						license: createFakeLicenseInfo({ activeModules: federation ? ['abac', 'federation'] : ['abac'] }),
					})),
				)
				.withEndpoint('GET', '/v1/abac/attributes.listAssignable', jest.fn().mockImplementation(assignableAttributes))
				.withEndpoint(
					'POST',
					'/v1/abac/attributes.checkAssignability',
					jest.fn().mockImplementation(() => ({})),
				)
				.withEndpoint('POST', '/v1/abac/rooms.evaluateMembership', jest.fn().mockImplementation(membershipPreview))
				.withEndpoint('POST', '/v1/teams.create', jest.fn().mockImplementation(createTeam))
				.withEndpoint(
					'GET',
					'/v1/rooms.nameExists',
					jest.fn().mockImplementation(() => ({ exists: false })),
				),
		)
		.build();
