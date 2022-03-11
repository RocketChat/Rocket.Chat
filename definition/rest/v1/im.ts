import Ajv, { JSONSchemaType } from 'ajv';

import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

const ajv = new Ajv();

type ImFiles = {
	roomId: IRoom['_id'];
	count: number;
	sort: string;
	query: string;
};

const ImFilesSchema: JSONSchemaType<ImFiles> = {
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

export const isImFiles = ajv.compile(ImFilesSchema);

type ImMembers = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	filter?: string;
	status?: string[];
};

const ImMembersSchema: JSONSchemaType<ImMembers> = {
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

export const isImMembers = ajv.compile(ImMembersSchema);

export type ImEndpoints = {
	'im.create': {
		POST: (
			params: (
				| {
						username: Exclude<IUser['username'], undefined>;
				  }
				| {
						usernames: string;
				  }
			) & {
				excludeSelf?: boolean;
			},
		) => {
			room: IRoom;
		};
	};
	'im.files': {
		GET: (params: ImFiles) => {
			files: IMessage[];
			total: number;
		};
	};
	'im.members': {
		GET: (params: ImMembers) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
};
