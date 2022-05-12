import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';

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
		GET: (params: { roomId: IRoom['_id']; count: number; sort: string; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'im.members': {
		GET: (params: { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'im.history': {
		GET: (params: PaginatedRequest<{ roomId: string; latest?: string }>) => PaginatedRequest<{
			messages: IMessage[];
		}>;
	};
	'im.close': {
		POST: (params: { roomId: string }) => {};
	};
	'im.kick': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'im.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'im.leave': {
		POST: (params: { roomId: string }) => {};
	};
	'im.messages': {
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
