import { Db } from 'mongodb';

import { TeamRaw } from '../../../app/models/server/raw/Team';
import { ITeam, ITeamMember, TEAM_TYPE } from '../../../definition/ITeam';
import { Authorization, Room } from '../../sdk';
import { ITeamCreateParams, ITeamService } from '../../sdk/types/ITeamService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { IRoom } from '../../../definition/IRoom';

export class TeamService extends ServiceClass implements ITeamService {
	protected name = 'team';

	private TeamModel: TeamRaw;

	private Users: UsersRaw;

	private TeamMembersModel: TeamMemberRaw;

	constructor(db: Db) {
		super();

		this.TeamModel = new TeamRaw(db.collection('rocketchat_team'));
		this.TeamMembersModel = new TeamMemberRaw(db.collection('rocketchat_team_member'));
		this.Users = new UsersRaw(db.collection('users'));
	}

	async create(uid: string, { team, room = { name: team.name, extraData: {} }, members }: ITeamCreateParams): Promise<ITeam> {
		const hasPermission = await Authorization.hasPermission(uid, 'create-team');
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const createdBy = await this.Users.findOneById(uid, { projection: { username: 1 } });
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		// TODO add validations to `data` and `members`

		const membersResult = await this.Users.findActiveByIds(members, { projection: { username: 1, _id: 0 } }).toArray();
		const memberUsernames = membersResult.map(({ username }) => username);

		const teamData = {
			...team,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
		};

		// create team
		const result = await this.TeamModel.insertOne(teamData);
		const teamId = result.insertedId;

		const membersList: Array<Omit<ITeamMember, '_id'>> = members?.map((memberId) => ({
			teamId,
			userId: memberId,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
		})) || [];

		membersList.push({
			teamId,
			userId: uid,
			roles: ['owner'],
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
		});

		await this.TeamMembersModel.insertMany(membersList);

		const roomType: IRoom['t'] = team.type === TEAM_TYPE.PRIVATE ? 'p' : 'c';

		const newRoom = {
			...room,
			type: roomType,
			name: team.name,
			members: memberUsernames,
			extraData: {
				...room.extraData,
				teamId,
			},
		};

		await Room.create(uid, newRoom);

		return {
			_id: teamId,
			...teamData,
		};
	}

	async list(uid: string): Promise<Array<ITeam>> {
		const records = await this.TeamMembersModel.find({ userId: uid }, { projection: { teamId: 1 } }).toArray();

		const teamIds = records.map(({ teamId }) => teamId);
		if (teamIds.length === 0) {
			return [];
		}

		return this.TeamModel.find({ _id: { $in: teamIds } }).toArray();
	}
}
