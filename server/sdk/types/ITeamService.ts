import { ITeam } from '../../../definition/ITeam';

export interface ITeamCreateParams {
	data: Pick<ITeam, 'name' | 'type'>;
	members?: Array<string>; // list of user _ids
}

export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	list(uid: string, filter?: string): Promise<Array<ITeam>>;
}
