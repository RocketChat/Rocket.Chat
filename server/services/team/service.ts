import { Db } from 'mongodb';

import { TeamRaw } from '../../../app/models/server/raw/Team';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
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

	private RoomsModel: RoomsRaw;

	private Users: UsersRaw;

	private TeamMembersModel: TeamMemberRaw;

	constructor(db: Db) {
		super();

		this.RoomsModel = new RoomsRaw(db.collection('rocketchat_room'));
		this.TeamModel = new TeamRaw(db.collection('rocketchat_team'));
		this.TeamMembersModel = new TeamMemberRaw(db.collection('rocketchat_team_member'));
		this.Users = new UsersRaw(db.collection('users'));
	}

	async create(uid: string, { team, room, members }: ITeamCreateParams): Promise<ITeam> {
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

	async addRoom(uid: string, rid: string, teamId: string): Promise<IRoom> {
		// TODO: what permissions do I need here?
		// const hasPermission = await Authorization.hasPermission(uid, 'add-room-to-team');
		// if (!hasPermission) {
		// 	throw new Error('no-permission');
		// }
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}
		const room = await this.RoomsModel.findOneByRoomIdAndUserId(rid, uid);
		if (!room) {
			throw new Error('invalid-room');
		}
		const team = await this.TeamModel.findOneById(teamId);
		if (!team) {
			throw new Error('invalid-team');
		}
		if (room.teamId) {
			throw new Error('room-already-on-team');
		}
		this.RoomsModel.updateOne({ _id: room._id }, { $set: { teamId } });
		return {
			...room,
		};
	}

	async removeRoom(uid: string, rid: string, teamId: string): Promise<IRoom> {
		// TODO: same as above: what permissions do I need here?
		// const hasPermission = await Authorization.hasPermission(uid, 'add-room-to-team');
		// if (!hasPermission) {
		// 	throw new Error('no-permission');
		// }
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}
		const room = await this.RoomsModel.findOneByRoomIdAndUserId(rid, uid);
		if (!room) {
			throw new Error('invalid-room');
		}
		const team = await this.TeamModel.findOneById(teamId);
		if (!team) {
			throw new Error('invalid-team');
		}
		if (room.teamId !== teamId) {
			throw new Error('room-not-on-that-team');
		}
		this.RoomsModel.updateOne({ _id: room._id }, { $unset: { teamId } });
		return {
			...room,
		};
	}

	async listRooms(uid: string, teamId: string): Promise<Array<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		const team = await this.TeamModel.findOneById(teamId);
		if (!team) {
			throw new Error('invalid-team');
		}
		if (team.type === TEAM_TYPE.PRIVATE) {
			// TODO: should I be able to list the rooms of a private team if i'm not on it and have admin privileges?
			// TODO: if team is private, check if user is on it
			console.log(uid); // TODO: remove this
			throw new Error('no-permission');
		}

		return this.RoomsModel.findByTeamId(teamId).toArray();
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
