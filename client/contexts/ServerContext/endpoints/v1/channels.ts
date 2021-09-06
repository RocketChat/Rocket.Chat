import type { IMessage } from '../../../../../definition/IMessage/IMessage';
import type { IRoom } from '../../../../../definition/IRoom';
import type { IUser } from '../../../../../definition/IUser';

export type ChannelsEndpoints = {
	'channels.files': {
		GET: (params: {
			roomId: IRoom['_id'];
			offset: number;
			count: number;
			sort: string;
			query: string;
		}) => {
			files: IMessage[];
			total: number;
		};
	};
	'channels.members': {
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
