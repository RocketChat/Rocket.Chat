import { Db } from 'mongodb';

import { TeamRaw } from '../../../app/models/server/raw/Team';
import { ITeam, ITeamMember, TEAM_TYPE, IRecordsWithTotal, IPaginationOptions } from '../../../definition/ITeam';
import { Authorization, Room } from '../../sdk';
import { ITeamCreateParams, ITeamService } from '../../sdk/types/ITeamService';
import { IUser } from '../../../definition/IUser';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { IRoom } from '../../../definition/IRoom';

export class TeamService extends ServiceClass implements ITeamService {
	protected name = 'team';

	private TeamModel: TeamRaw;

	private Users: UsersRaw;

	private TeamMembersModel: TeamMemberRaw;

	// TODO not sure we should have the collection here or call the Room service for getting Room data
	private Rooms: RoomsRaw;

	constructor(db: Db) {
		super();

		this.TeamModel = new TeamRaw(db.collection('rocketchat_team'));
		this.TeamMembersModel = new TeamMemberRaw(db.collection('rocketchat_team_member'));
		this.Users = new UsersRaw(db.collection('users'));
		this.Rooms = new RoomsRaw(db.collection('rocketchat_room'));
	}

	async create(uid: string, { team, room = { name: team.name, extraData: {} }, members, owner }: ITeamCreateParams): Promise<ITeam> {
		const hasPermission = await Authorization.hasPermission(uid, 'create-team');
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const existingTeam = await this.TeamModel.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingTeam) {
			throw new Error('team-name-already-exists');
		}

		const existingRoom = await this.Rooms.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingRoom) {
			throw new Error('room-name-already-exists');
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
			roomId: '', // this will be populated at the end
		};

		try {
			const result = await this.TeamModel.insertOne(teamData);
			const teamId = result.insertedId;
			// the same uid can be passed at 3 positions: owner, member list or via caller
			// if the owner is present, remove it from the members list
			// if the owner is not present, remove the caller from the members list
			const excludeFromMembers = owner ? [owner] : [uid];

			const membersList: Array<Omit<ITeamMember, '_id'>> = members?.filter((memberId) => !excludeFromMembers.includes(memberId))
				.map((memberId) => ({
					teamId,
					userId: memberId,
					createdAt: new Date(),
					createdBy,
					_updatedAt: new Date(), // TODO how to avoid having to do this?
				})) || [];

			membersList.push({
				teamId,
				userId: owner || uid,
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
					teamMain: true,
				},
			};

			const createdRoom = await Room.create(owner || uid, newRoom);

			await this.TeamModel.updateMainRoomForTeam(teamId, createdRoom._id);

			return {
				_id: teamId,
				...teamData,
			};
		} catch (e) {
			throw new Error('error-team-creation');
		}
	}

	async list(uid: string, { offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeam>> {
		const userTeams = await this.TeamMembersModel.findByUserId(uid, { projection: { teamId: 1 } }).toArray();

		const teamIds = userTeams.map(({ teamId }) => teamId);
		if (teamIds.length === 0) {
			return {
				total: 0,
				records: [],
			};
		}

		const cursor = this.TeamModel.findByIds(teamIds, {
			limit: count,
			skip: offset,
		});

		return {
			total: await cursor.count(),
			records: await cursor.toArray(),
		};
	}

	async listAll({ offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeam>> {
		const cursor = this.TeamModel.find({}, {
			limit: count,
			skip: offset,
		});

		return {
			total: await cursor.count(),
			records: await cursor.toArray(),
		};
	}

	async members(userId: string, teamId: string): Promise<Array<ITeamMember>> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId);
		const hasPermission = await Authorization.hasAtLeastOnePermission(userId, ['add-team-member', 'edit-team-member', 'view-all-teams']);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		if (!isMember && !hasPermission) {
			return [];
		}

		return this.TeamMembersModel.findByTeamId(teamId).toArray();
	}

	async addMember({ _id, username }: IUser, userId: string, teamId: string): Promise<boolean> {
		const isAlreadyAMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, { projection: { _id: 1 } });

		if (isAlreadyAMember) {
			return false;
		}

		return !!await this.TeamMembersModel.createOneByTeamIdAndUserId(teamId, userId, { _id, username });
	}

	async getOneByRoomId(roomId: string): Promise<ITeam | null> {
		return this.TeamModel.findOneByMainRoomId(roomId, { projection: { _id: 1 } });
	}

	async addRolesToMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, { projection: { _id: 1 } });

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!await this.TeamMembersModel.updateRolesByTeamIdAndUserId(teamId, userId, roles);
	}

	async removeRolesFromMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, { projection: { _id: 1 } });

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!await this.TeamMembersModel.removeRolesByTeamIdAndUserId(teamId, userId, roles);
	}
}
