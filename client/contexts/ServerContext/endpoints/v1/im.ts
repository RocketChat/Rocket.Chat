import type { IMessage } from '../../../../../definition/IMessage';
import type { IRoom } from '../../../../../definition/IRoom';
import type { IUser } from '../../../../../definition/IUser';

export type ImEndpoints = {
	'im.create': {
		POST: (
			payload: (
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
		GET: (params: {
			roomId: string;
			offset?: number;
			count?: number;
			filter?: string;
			status?: string[];
		}) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
};
