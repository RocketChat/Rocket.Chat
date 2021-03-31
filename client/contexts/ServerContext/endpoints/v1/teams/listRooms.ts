import { IRoom } from '../../../../../../definition/IRoom';


export type ListRoomsEndpoint = {
	GET: (params: { teamId: string; offset?: number; count?: number; query: string }) => {
		count: number;
		offset: number;
		total: number;
		rooms: IRoom[];
	};
}
