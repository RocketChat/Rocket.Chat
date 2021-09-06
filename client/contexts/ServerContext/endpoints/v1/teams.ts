import type { IRoom } from '../../../../../definition/IRoom';
import type { IRecordsWithTotal, ITeam } from '../../../../../definition/ITeam';
import { IUser } from '../../../../../definition/IUser';

export type TeamsEndpoints = {
	'teams.addRooms': {
		POST: (params: { rooms: IRoom['_id'][]; teamId: string }) => void;
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
	'teams.create': {
		POST: (payload: {
			name: ITeam['name'];
			type?: ITeam['type'];
			members?: IUser['_id'][];
			room: {
				id?: string;
				name?: IRoom['name'];
				members?: IUser['_id'][];
				readOnly?: boolean;
				extraData?: {
					teamId?: string;
					teamMain?: boolean;
				} & { [key: string]: string | boolean };
				options?: {
					nameValidationRegex?: string;
					creator: string;
					subscriptionExtra?: {
						open: boolean;
						ls: Date;
						prid: IRoom['_id'];
					};
				} & {
					[key: string]:
						| string
						| {
								open: boolean;
								ls: Date;
								prid: IRoom['_id'];
						  };
				};
			};
			owner?: IUser['_id'];
		}) => {
			team: ITeam;
		};
	};
};
