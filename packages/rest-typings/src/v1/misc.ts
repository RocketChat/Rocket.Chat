import type { IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type MiscEndpoints = {
	'stdout.queue': {
		GET: () => {
			queue: {
				id: string;
				string: string;
				ts: Date;
			}[];
		};
	};

	// type DefaultUserFields = {
	// 	[k: string]: number;
	// };

	'me': {
		GET: (params: { fields: { [k: string]: number }; user: IUser }) => IUser & {
			email?: string;
			settings: {
				profile: {};
				preferences: unknown;
			};
			avatarUrl: string;
		};
	};

	'shield.svg': {
		GET: (params: { type: string; icon: string; channel: string; name: string; text: string; color: string; size: number }) => {
			svg: string;
		};
	};

	'spotlight': {
		GET: (params: { query: string; limit: number; offset: number }) => {
			users: Pick<IUser, 'username' | 'nickname' | 'name' | 'status' | 'statusText' | 'avatarETag'>[];
			rooms: IRoom[];
		};
	};

	'directory': {
		GET: (
			params: PaginatedRequest<{
				text: string;
				type: string;
				workspace: string;
			}>,
		) => PaginatedResult<{
			result: (IUser | IRoom | ITeam)[];
		}>;
	};

	'method.call': {
		POST: (params: { method: string; params: unknown; id: string }) => {
			result: unknown;
		};
	};

	'method.callAnon': {
		POST: (params: { method: string; params: unknown; id: string }) => {
			result: unknown;
		};
	};
};
