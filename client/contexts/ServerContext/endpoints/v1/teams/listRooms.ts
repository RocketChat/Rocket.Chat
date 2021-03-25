import { IRoom } from '../../../../../../definition/IRoom';

export type ListRoomsEndpoint = {
	GET: (params: { teamId: string }) => {
		rooms: IRoom[];
		total: number;
		count: number;
		offset: number;
	};
};
