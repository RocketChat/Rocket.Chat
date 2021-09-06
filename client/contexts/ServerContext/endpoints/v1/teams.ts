import type { IRoom } from '../../../../../definition/IRoom';
import type { IRecordsWithTotal } from '../../../../../definition/ITeam';

export type TeamsEndpoints = {
	'teams.addRooms': {
		POST: (params: { rooms: IRoom['_id'][]; teamId: string }) => {
			success: true;
			statusCode: 200;
			body: IRoom[];
		};
	};
	'teams.listRooms': {
		GET: (params: {
			teamId: string;
			offset?: number;
			count?: number;
			filter: string;
			type: string;
		}) => Omit<IRecordsWithTotal<IRoom>, 'records'> & {
			count: number;
			offset: number;
			rooms: IRecordsWithTotal<IRoom>['records'];
		};
	};
	'teams.listRoomsOfUser': {
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
};
