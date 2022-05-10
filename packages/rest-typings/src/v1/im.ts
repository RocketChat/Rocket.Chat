import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';

export type ImEndpoints = {
	'/v1/im.create': {
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
	'/v1/im.files': {
		GET: (params: { roomId: IRoom['_id']; count: number; sort: string; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'/v1/im.members': {
		GET: (params: { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'/v1/im.history': {
		GET: (params: PaginatedRequest<{ roomId: string; latest?: string }>) => PaginatedRequest<{
			messages: IMessage[];
		}>;
	};
	'/v1/im.close': {
		POST: (params: { roomId: string }) => {};
	};
	'/v1/im.kick': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'/v1/im.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'/v1/im.leave': {
		POST: (params: { roomId: string }) => {};
	};
	'/v1/im.messages': {
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
