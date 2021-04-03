import { IRoom } from '../../../../../../definition/IRoom';
import { IRecordsWithTotal } from '../../../../../../definition/ITeam';


export type ListRoomsEndpoint = {
	GET: (params: { teamId: string; offset?: number; count?: number; filter: string; type: string }) => Omit<IRecordsWithTotal<IRoom>, 'records'> & {
		count: number;
		offset: number;
		rooms: IRecordsWithTotal<IRoom>['records'];
	};
}
