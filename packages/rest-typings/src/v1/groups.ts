import type { IMessage, IRoom, ITeam, IGetRoomRoles, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type GroupsEndpoints = {
	'groups.files': {
		GET: (
			params:
				| { roomId: IRoom['_id']; count: number; sort: string; query: string }
				| { roomName: IRoom['name']; count: number; sort: string; query: string },
		) => {
			files: IMessage[];
			total: number;
		};
	};
	'groups.members': {
		GET: (
			params:
				| { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }
				| { roomName: IRoom['name']; offset?: number; count?: number; filter?: string; status?: string[] },
		) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'groups.history': {
		GET: (params: PaginatedRequest<{ roomId: string; latest?: string } | { roomName: string; latest?: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'groups.archive': {
		POST: (params: { roomId: string } | { roomName: string }) => void;
	};
	'groups.unarchive': {
		POST: (params: { roomId: string } | { roomName: string }) => void;
	};
	'groups.create': {
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
	'groups.convertToTeam': {
		POST: (params: { roomId: string; roomName: string }) => { team: ITeam };
	};
	'groups.counters': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			joined: boolean;
			members: number;
			unreads: number;
			unreadsFrom: Date;
			msgs: number;
			latest: Date;
			userMentions: number;
		};
	};
	'groups.close': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'groups.kick': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'groups.delete': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'groups.leave': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'groups.roles': {
		GET: (params: { roomId: string } | { roomName: string }) => { roles: IGetRoomRoles[] };
	};
	'groups.messages': {
		GET: (
			params:
				| PaginatedRequest<{
						roomId: IRoom['_id'];
						query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
						sort: { ts: number };
				  }>
				| PaginatedRequest<{
						roomName: IRoom['name'];
						query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
						sort: { ts: number };
				  }>,
		) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
};
