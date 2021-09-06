import type { IMessage } from '../../../../../definition/IMessage';
import type { IRoom } from '../../../../../definition/IRoom';
import type { IUser } from '../../../../../definition/IUser';

export type GroupsEndpoints = {
	'groups.files': {
		GET: (params: { roomId: IRoom['_id']; count: number; sort: string; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'groups.members': {
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
