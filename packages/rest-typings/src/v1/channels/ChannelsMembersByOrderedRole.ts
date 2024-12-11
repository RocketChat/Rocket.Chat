import type { IRole, IRoom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

type MembersOrderedByRoleProps = {
	roomId?: IRoom['_id'];
	roomName?: IRoom['name'];
	status?: string[];
	filter?: string;
	rolesOrder?: IRole['_id'][];
};

export type ChannelsMembersOrderedByRoleProps = PaginatedRequest<MembersOrderedByRoleProps>;

const membersOrderedByRoleRolePropsSchema = {
	properties: {
		roomId: {
			type: 'string',
		},
		roomName: {
			type: 'string',
		},
		rolesOrder: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		status: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		filter: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'integer',
			nullable: true,
		},
		offset: {
			type: 'integer',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
};

export const isChannelsMembersOrderedByRoleProps = ajv.compile<ChannelsMembersOrderedByRoleProps>(membersOrderedByRoleRolePropsSchema);
