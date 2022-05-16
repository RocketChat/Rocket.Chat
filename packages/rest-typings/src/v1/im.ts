import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

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
		GET: (params: PaginatedRequest<{ roomId: string }> | PaginatedRequest<{ roomName: IRoom['_id'] }>) => PaginatedResult<{
			files: IMessage[];
			total: number;
		}>;
	};
	'im.members': {
		GET: (
			params: PaginatedRequest<({ roomId: string } | { roomName: IRoom['name'] }) & { filter?: string; status?: string[] }>,
		) => PaginatedResult<{
			members: IUser[];
		}>;
	};
	'im.history': {
		GET: (params: PaginatedRequest<{ roomId: string; latest?: string } | { roomName: string; latest?: string }>) => PaginatedRequest<{
			messages: IMessage[];
		}>;
	};
	'im.close': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'im.kick': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'im.delete': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'im.leave': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'im.messages': {
		GET: (
			params:
				| PaginatedRequest<{
						roomId: string;
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
