import { Db } from 'mongodb';

import { TeamRaw } from '../../../app/models/server/raw/Team';
import { ITeam } from '../../../definition/ITeam';
import { Authorization } from '../../sdk';
import { ITeamCreateParams, ITeamService } from '../../sdk/types/ITeamService';
import { ServiceClass } from '../../sdk/types/ServiceClass';

export class TeamService extends ServiceClass implements ITeamService {
	protected name = 'team';

	private TeamModel: TeamRaw;

	constructor(db: Db) {
		super();

		this.TeamModel = new TeamRaw(db.collection('rocketchat_team'));
	}

	async create({ uid, data, members}: ITeamCreateParams): Promise<ITeam> {
		const hasPermission = await Authorization.hasPermission(uid, 'create-team');
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const wut = await this.TeamModel.insertOne(data);

		console.log('wut ->', wut);

		const team = {
			_id: 'somethi',
			...data,
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
