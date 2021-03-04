import { ServiceClass } from '../../sdk/types/ServiceClass';
import { ITeamService } from '../../sdk/types/ITeamService';
import { Authorization } from '../../sdk';
import { ITeam } from '../../../definition/ITeam';

export class TeamService extends ServiceClass implements ITeamService {
	protected name = 'team';

	// constructor(db: Db) {
	// 	super();
	// }

	async create(uid: string, doc: Omit<ITeam, '_id'>): Promise<ITeam> {
		const hasPermission = await Authorization.hasPermission(uid, 'create-team');
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const team = {
			_id: 'somethi',
			...doc,
		};

		return team;
	}

	async list(uid: string): Promise<Array<ITeam>> {
		return [{
			_id: 'aa',
			name: 'ok',
			type: 0,
			createdAt: new Date(),
			createdBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			_updatedAt: new Date(),
		}];
	}
}
