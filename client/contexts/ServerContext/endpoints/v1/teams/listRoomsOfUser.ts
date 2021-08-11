import { IRoom } from '../../../../../../definition/IRoom';
import { IRecordsWithTotal } from '../../../../../../definition/ITeam';

export type ListRoomsOfUserEndpoint = {
	GET: (params: {
		teamId: string;
		teamName?: string;
		userId?: string;
		canUserDelete?: boolean;
		offset?: number;
		count?: number;
	}) => Omit<IRecordsWithTotal<IRoom>, 'records'> & {
		count: number;
		offset: number;
		rooms: IRecordsWithTotal<IRoom>['records'];
	};
};
