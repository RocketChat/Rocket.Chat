import { ITeam } from '../../../definition/ITeam';

export interface ITeamCreateParams {
	uid: string;
	data: Omit<ITeam, '_id'>;
	members?: Array<string>;
}

export interface ITeamService {
	create(params: ITeamCreateParams): Promise<ITeam>;
	list(uid: string, filter?: string): Promise<Array<ITeam>>;
}
