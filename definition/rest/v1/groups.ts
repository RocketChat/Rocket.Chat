import Ajv, { JSONSchemaType } from 'ajv';

import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

const ajv = new Ajv();

type GroupsFiles = {
	roomId: IRoom['_id'];
	count: number;
	sort: string;
	query: string;
};

const GroupsFilesSchema: JSONSchemaType<GroupsFiles> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
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
	required: ['roomId', 'count', 'sort', 'query'],
	additionalProperties: false,
};

export const isGroupsFiles = ajv.compile(GroupsFilesSchema);

type GroupsMembers = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	filter?: string;
	status?: string[];
};

const GroupsMembersSchema: JSONSchemaType<GroupsMembers> = {
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

export const isGroupsMembers = ajv.compile(GroupsMembersSchema);

export type GroupsEndpoints = {
	'groups.files': {
		GET: (params: GroupsFiles) => {
			files: IMessage[];
			total: number;
		};
	};
	'groups.members': {
		GET: (params: GroupsMembers) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
};
