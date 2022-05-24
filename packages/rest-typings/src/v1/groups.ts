import type { IMessage, IRoom, ITeam, IGetRoomRoles, IUser, IUpload } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type GroupsEndpoints = {
	'/v1/groups.files': {
		GET: (params: PaginatedRequest<{ roomId: IRoom['_id']; query: string }>) => PaginatedResult<{
			files: IUpload[];
		}>;
	};
	'/v1/groups.members': {
		GET: (params: { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
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
		POST: (params: { roomId: string }) => void;
	};
	'/v1/groups.unarchive': {
		POST: (params: { roomId: string }) => void;
	};
	'/v1/groups.create': {
		POST: (params: {
			name: string;
			members: string[];
			readOnly: boolean;
			extraData: {
				broadcast: boolean;
				encrypted: boolean;
				teamId?: string;
			};
		}) => {
			group: Partial<IRoom>;
		};
	};
	'/v1/groups.convertToTeam': {
		POST: (params: { roomId: string; roomName: string }) => { team: ITeam };
	};
	'/v1/groups.counters': {
		GET: (params: { roomId: string }) => {
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
		POST: (params: { roomId: string }) => {};
	};
	'/v1/groups.kick': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'/v1/groups.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'/v1/groups.leave': {
		POST: (params: { roomId: string }) => {};
	};
	'/v1/groups.roles': {
		GET: (params: { roomId: string }) => { roles: IGetRoomRoles[] };
	};
	'/v1/groups.messages': {
		GET: (params: {
			roomId: IRoom['_id'];
			query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
			offset: number;
			sort: { ts: number };
		}) => {
			messages: IMessage[];
		};
	};
};
