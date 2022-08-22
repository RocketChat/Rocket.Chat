import type { IMessage, IRoom, ITeam, IGetRoomRoles, IUser, IUpload } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type GroupsFilesProps = {
	roomId: IRoom['_id'];
	count: number;
	sort: string;
	query: string;
};

const GroupsFilesPropsSchema = {
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

export const isGroupsFilesProps = ajv.compile<GroupsFilesProps>(GroupsFilesPropsSchema);

type GroupsMembersProps = {
	roomId: IRoom['_id'];
	offset?: number;
	count?: number;
	filter?: string;
	status?: string[];
};

const GroupsMembersPropsSchema = {
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

export const isGroupsMembersProps = ajv.compile<GroupsMembersProps>(GroupsMembersPropsSchema);

type GroupsArchiveProps = {
	roomId: IRoom['_id'];
};

const GroupsArchivePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsArchiveProps = ajv.compile<GroupsArchiveProps>(GroupsArchivePropsSchema);

type GroupsUnarchiveProps = {
	roomId: IRoom['_id'];
};

const GroupsUnarchivePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsUnarchiveProps = ajv.compile<GroupsUnarchiveProps>(GroupsUnarchivePropsSchema);

type GroupsCreateProps = {
	name: string;
	members: string[];
	readOnly: boolean;
	extraData: {
		broadcast: boolean;
		encrypted: boolean;
		teamId?: string;
	};
};

const GroupsCreatePropsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
		members: {
			type: 'array',
			items: { type: 'string' },
		},
		readOnly: {
			type: 'boolean',
		},
		extraData: {
			type: 'object',
			properties: {
				broadcast: {
					type: 'boolean',
				},
				encrypted: {
					type: 'boolean',
				},
				teamId: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['broadcast', 'encrypted'],
			additionalProperties: false,
		},
	},
	required: ['name', 'members', 'readOnly', 'extraData'],
	additionalProperties: false,
};

export const isGroupsCreateProps = ajv.compile<GroupsCreateProps>(GroupsCreatePropsSchema);

type GroupsConvertToTeamProps = {
	roomId: string;
	roomName: string;
};

const GroupsConvertToTeamPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		roomName: {
			type: 'string',
		},
	},
	required: ['roomId', 'roomName'],
	additionalProperties: false,
};

export const isGroupsConvertToTeamProps = ajv.compile<GroupsConvertToTeamProps>(GroupsConvertToTeamPropsSchema);

type GroupsCountersProps = {
	roomId: string;
};

const GroupsCountersPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);

type GroupsCloseProps = {
	roomId: string;
};

const GroupsClosePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsCloseProps = ajv.compile<GroupsCloseProps>(GroupsClosePropsSchema);

type GroupsDeleteProps = {
	roomId: string;
};

const GroupsDeletePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsDeleteProps = ajv.compile<GroupsDeleteProps>(GroupsDeletePropsSchema);

type GroupsLeaveProps = {
	roomId: string;
};

const GroupsLeavePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsLeaveProps = ajv.compile<GroupsLeaveProps>(GroupsLeavePropsSchema);

type GroupsRolesProps = {
	roomId: string;
};

const GroupsRolesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsRolesProps = ajv.compile<GroupsRolesProps>(GroupsRolesPropsSchema);

type GroupsKickProps = {
	roomId: string;
	userId: string;
};

const GroupsKickPropsSchema = {
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

export const isGroupsKickProps = ajv.compile<GroupsKickProps>(GroupsKickPropsSchema);

type GroupsMessageProps = PaginatedRequest<{
	roomId: IRoom['_id'];
}>;

const GroupsMessagePropsSchema = {
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

export const isGroupsMessageProps = ajv.compile<GroupsMessageProps>(GroupsMessagePropsSchema);

export type GroupsEndpoints = {
	'/v1/groups.files': {
		GET: (params: GroupsFilesProps) => PaginatedResult<{
			files: IUpload[];
		}>;
	};
	'/v1/groups.members': {
		GET: (params: GroupsMembersProps) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'/v1/groups.history': {
		GET: (params: PaginatedRequest<{ roomId: string; latest?: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/groups.archive': {
		POST: (params: GroupsArchiveProps) => void;
	};
	'/v1/groups.unarchive': {
		POST: (params: GroupsUnarchiveProps) => void;
	};
	'/v1/groups.create': {
		POST: (params: GroupsCreateProps) => {
			group: Partial<IRoom>;
		};
	};
	'/v1/groups.convertToTeam': {
		POST: (params: GroupsConvertToTeamProps) => { team: ITeam };
	};
	'/v1/groups.counters': {
		GET: (params: GroupsCountersProps) => {
			joined: boolean;
			members: number;
			unreads: number;
			unreadsFrom: Date;
			msgs: number;
			latest: Date;
			userMentions: number;
		};
	};
	'/v1/groups.close': {
		POST: (params: GroupsCloseProps) => void;
	};
	'/v1/groups.kick': {
		POST: (params: GroupsKickProps) => void;
	};
	'/v1/groups.delete': {
		POST: (params: GroupsDeleteProps) => void;
	};
	'/v1/groups.leave': {
		POST: (params: GroupsLeaveProps) => void;
	};
	'/v1/groups.roles': {
		GET: (params: GroupsRolesProps) => { roles: IGetRoomRoles[] };
	};
	'/v1/groups.messages': {
		GET: (params: GroupsMessageProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/groups.addModerator': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.removeModerator': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.addOwner': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.removeOwner': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.addLeader': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.removeLeader': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
};
