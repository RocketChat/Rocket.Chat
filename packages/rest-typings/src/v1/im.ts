import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv();

// Should it be made with PaginatedRequest<> to remove count, sort and query?
type ImFilesProps = {
	roomId: IRoom['_id'];
	count: number;
	sort: string;
	query: string;
};

const ImFilesPropsSchema = {
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

export const isImFilesProps = ajv.compile(ImFilesPropsSchema);

type ImMembersProps = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	filter?: string;
	status?: string[];
};

const ImMembersPropsSchema = {
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

export const isImMembersProps = ajv.compile(ImMembersPropsSchema);

type ImHistoryProps = PaginatedRequest<{
	roomId: string;
	latest?: string;
}>;

const ImHistoryPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		latest: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isImHistoryProps = ajv.compile(ImHistoryPropsSchema);

type ImCloseProps = {
	roomId: string;
};

const ImClosePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isImCloseProps = ajv.compile(ImClosePropsSchema);

type ImDeleteProps = {
	roomId: string;
};

const ImDeletePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isImDeleteProps = ajv.compile(ImDeletePropsSchema);

type ImLeaveProps = {
	roomId: string;
};

const ImLeavePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isImLeaveProps = ajv.compile(ImLeavePropsSchema);

type ImKickProps = {
	roomId: string;
	userId: string;
};

const ImKickPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
	},
	required: ['roomId', 'userId'],
	additionalProperties: false,
};

export const isImKickProps = ajv.compile(ImKickPropsSchema);

type ImMessagesProps = PaginatedRequest<{
	roomId: string;
}>;

const ImMessagesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isImMessagesProps = ajv.compile(ImMessagesPropsSchema);

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
		GET: (params: ImFilesProps) => {
			files: IMessage[];
			total: number;
		};
	};
	'im.members': {
		GET: (params: ImMembersProps) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'im.history': {
		GET: (params: ImHistoryProps) => PaginatedRequest<{
			messages: IMessage[];
		}>;
	};
	'im.close': {
		POST: (params: ImCloseProps) => {};
	};
	'im.kick': {
		POST: (params: ImKickProps) => {};
	};
	'im.delete': {
		POST: (params: ImDeleteProps) => {};
	};
	'im.leave': {
		POST: (params: ImLeaveProps) => {};
	};
	'im.messages': {
		GET: (params: ImMessagesProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
};
