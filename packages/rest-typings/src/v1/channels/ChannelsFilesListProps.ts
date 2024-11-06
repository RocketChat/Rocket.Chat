import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChannelsFilesListProps = PaginatedRequest<
	({ roomId: string; roomName?: string } | { roomId?: string; roomName: string }) & {
		name?: string;
		typeGroup?: string;
		query?: string;
	}
>;

const channelsFilesListPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: true,
		},
		roomName: {
			type: 'string',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
			nullable: true,
		},
		typeGroup: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	required: [],
	additionalProperties: false,
};

export const isChannelsFilesListProps = ajv.compile<ChannelsFilesListProps>(channelsFilesListPropsSchema);
