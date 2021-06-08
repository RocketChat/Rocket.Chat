import { IUser } from '../../../../../../definition/IUser';

export type ChannelsMembersEndpoint = {
	GET: (params: {
		roomId: string;
		offset?: number;
		count?: number;
		filter?: string;
		status?: Array<string>;
	}) => {
		count: number;
		offset: number;
		members: Array<IUser>;
		total: number;
	};
};
