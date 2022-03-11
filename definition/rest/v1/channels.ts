import Ajv, { JSONSchemaType } from 'ajv';

import type { IMessage } from '../../IMessage/IMessage';
import type { IRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

const ajv = new Ajv();

type ChannelsFiles = {
	roomId: IRoom['_id'];
	offset: number;
	count: number;
	sort: string;
	query: string;
};

const ChannelsFilesSchema: JSONSchemaType<ChannelsFiles> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
	},
	required: ['roomId', 'offset', 'count', 'sort', 'query'],
	additionalProperties: false,
};

export const isChannelsFiles = ajv.compile(ChannelsFilesSchema);

type ChannelsMembers = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	filter?: string;
	status?: string[];
};

const ChannelsMembersSchema: JSONSchemaType<ChannelsMembers> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		filter: {
			type: 'string',
			nullable: true,
		},
		status: {
			type: 'array',
			items: { type: 'string' },
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChannelsMembers = ajv.compile(ChannelsMembersSchema);

export type ChannelsEndpoints = {
	'channels.files': {
		GET: (params: ChannelsMembers) => {
			files: IMessage[];
			total: number;
		};
	};
	'channels.members': {
		GET: (params: ChannelsMembers) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
};
