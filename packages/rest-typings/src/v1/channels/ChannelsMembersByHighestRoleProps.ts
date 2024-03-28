import type { IRoom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

type MembersByHighestRoleProps = {
	roomId?: IRoom['_id'];
	roomName?: IRoom['name'];
	status?: string[];
	filter?: string;
};

export type ChannelsMembersByHighestRoleProps = PaginatedRequest<MembersByHighestRoleProps>;

const membersByHighestRolePropsSchema = {
	properties: {
		roomId: {
			type: 'string',
		},
		roomName: {
			type: 'string',
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

export const isChannelsMembersByHighestRoleProps = ajv.compile<ChannelsMembersByHighestRoleProps>(membersByHighestRolePropsSchema);
