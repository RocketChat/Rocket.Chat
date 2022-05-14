import type { IMessage, IRoom, IUser, IUpload } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type ImEndpoints = {
	'im.create': {
		POST: (params: { username?: Exclude<IUser['username'], undefined>; usernames?: string; excludeSelf?: boolean }) => {
			room: IRoom & { rid: IRoom['_id'] };
		};
	};
	'im.delete': {
		POST: (params: { roomId?: string; username?: string }) => void;
	};
	'im.close': {
		POST: (params: { roomId: string }) => void;
	};
	'im.counters': {
		GET: (params: { roomId: string; userId?: string }) => {
			joined: boolean;
			unreads: number | null;
			unreadsFrom: string | null;
			msgs: number | null;
			members: number | null;
			latest: string | null;
			userMentions: number | null;
		};
	};
	'im.files': {
		GET: (params: PaginatedRequest<{ roomId?: IRoom['_id']; username?: string; query?: string; fields?: string }>) => PaginatedResult<{
			files: IUpload[];
		}>;
	};
	'im.history': {
		GET: (
			params: PaginatedRequest<{
				roomId: string;
				latest?: string;
				oldest?: string;
				inclusive?: string;
				unreads?: string;
				showThreadMessages?: string;
			}>,
		) => {
			messages: Pick<IMessage, '_id' | 'rid' | 'msg' | 'ts' | '_updatedAt' | 'u'>[];
		};
	};

	'im.members': {
		GET: (params: PaginatedRequest<{ roomId?: IRoom['_id']; username?: string; filter?: string; status?: string[] }>) => PaginatedResult<{
			members: Pick<IUser, '_id' | 'status' | 'name' | 'username' | 'utcOffset'>[];
		}>;
	};
	'im.messages': {
		GET: (
			params: PaginatedRequest<{
				roomId?: IRoom['_id'];
				username?: string;
				query?: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
				fields?: string;
			}>,
		) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'im.messages.others': {
		GET: (params: PaginatedRequest<{ roomId: IRoom['_id']; query?: string; fields?: string }>) => PaginatedResult<{ message: IMessage[] }>;
	};
	'im.list': {
		GET: (params: PaginatedRequest<{ fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'im.list.everyone': {
		GET: (params: PaginatedRequest<{ query: string; fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'im.open': {
		POST: (params: { roomId: string }) => void;
	};
	'im.setTopic': {
		POST: (params: { roomId: string; topic: string }) => {
			topic: string;
		};
	};
};
