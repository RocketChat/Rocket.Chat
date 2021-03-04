import { ITeam } from '../../../definition/ITeam';

export interface ITeamService {
	create(uid: string, team: Omit<ITeam, '_id'>): Promise<ITeam>;
	list(uid: string, filter?: string): Promise<Array<ITeam>>;
}
