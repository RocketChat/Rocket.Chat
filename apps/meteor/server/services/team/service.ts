import { FindOptions, Filter } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal, ITeam, ITeamMember, ITeamStats, TEAM_TYPE } from '@rocket.chat/core-typings';
import { Team, Rooms, Subscriptions, Users, TeamMember } from '@rocket.chat/models';
import type { InsertionModel } from '@rocket.chat/model-typings';

import { checkUsernameAvailability } from '../../../app/lib/server/functions';
import { addUserToRoom } from '../../../app/lib/server/functions/addUserToRoom';
import { removeUserFromRoom } from '../../../app/lib/server/functions/removeUserFromRoom';
import { getSubscribedRoomsForUserWithDetails } from '../../../app/lib/server/functions/getRoomsWithSingleOwner';
import { Messages } from '../../../app/models/server';
import { Room, Authorization } from '../../sdk';
import {
	IListRoomsFilter,
	ITeamAutocompleteResult,
	ITeamCreateParams,
	ITeamInfo,
	ITeamMemberInfo,
	ITeamMemberParams,
	ITeamService,
	ITeamUpdateData,
} from '../../sdk/types/ITeamService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { saveRoomName } from '../../../app/channel-settings/server';
import { saveRoomType } from '../../../app/channel-settings/server/functions/saveRoomType';

export class TeamService extends ServiceClassInternal implements ITeamService {
	protected name = 'team';

	async create(uid: string, { team, room = { name: team.name, extraData: {} }, members, owner }: ITeamCreateParams): Promise<ITeam> {
		if (!checkUsernameAvailability(team.name)) {
			throw new Error('team-name-already-exists');
		}

		const existingRoom = await Rooms.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingRoom && existingRoom._id !== room.id) {
			throw new Error('room-name-already-exists');
		}

		const createdBy = await Users.findOneById<Pick<IUser, 'username' | '_id'>>(uid, {
			projection: { username: 1 },
		});
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		// TODO add validations to `data` and `members`

		const membersResult =
			!members || !Array.isArray(members) || members.length === 0
				? []
				: await Users.findActiveByIdsOrUsernames(members, {
						projection: { username: 1 },
				  }).toArray();
		const memberUsernames = membersResult.map(({ username }) => username);
		const memberIds = membersResult.map(({ _id }) => _id);

		const teamData = {
			...team,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
			roomId: '', // this will be populated at the end
		};

		try {
			const result = await Team.insertOne(teamData);
			const teamId = result.insertedId;
			// the same uid can be passed at 3 positions: owner, member list or via caller
			// if the owner is present, remove it from the members list
			// if the owner is not present, remove the caller from the members list
			const excludeFromMembers = owner ? [owner] : [uid];

			// filter empty strings and falsy values from members list
			const membersList: Array<InsertionModel<ITeamMember>> =
				memberIds
					?.filter(Boolean)
					.filter((memberId) => !excludeFromMembers.includes(memberId))
					.map((memberId) => ({
						teamId,
						userId: memberId,
						createdAt: new Date(),
						createdBy,
					})) || [];

			membersList.push({
				teamId,
				userId: owner || uid,
				roles: ['owner'],
				createdAt: new Date(),
				createdBy,
			});

			await TeamMember.insertMany(membersList);

			let roomId = room.id;
			if (roomId) {
				await Rooms.setTeamMainById(roomId, teamId);
				Messages.createUserConvertChannelToTeamWithRoomIdAndUser(roomId, team.name, createdBy);
			} else {
				const roomType: IRoom['t'] = team.type === TEAM_TYPE.PRIVATE ? 'p' : 'c';

				const newRoom = {
					...room,
					type: roomType,
					name: team.name,
					members: memberUsernames as string[],
					extraData: {
						...room.extraData,
						teamId,
						teamMain: true,
					},
				};

				const createdRoom = await Room.create(owner || uid, newRoom);
				roomId = createdRoom._id;
			}

			await Team.updateMainRoomForTeam(teamId, roomId);
			teamData.roomId = roomId;

			return {
				_id: teamId,
				...teamData,
			};
		} catch (e) {
			throw new Error('error-team-creation');
		}
	}

	async update(uid: string, teamId: string, updateData: ITeamUpdateData): Promise<void> {
		const team = await Team.findOneById<Pick<ITeam, '_id' | 'roomId'>>(teamId, {
			projection: { roomId: 1 },
		});
		if (!team) {
			return;
		}

		const user = await Users.findOneById(uid);
		if (!user) {
			return;
		}

		const { name, type, updateRoom = true } = updateData;

		if (updateRoom && name) {
			await saveRoomName(team.roomId, name, user);
		}

		if (updateRoom && typeof type !== 'undefined') {
			saveRoomType(team.roomId, type === TEAM_TYPE.PRIVATE ? 'p' : 'c', user);
		}

		await Team.updateNameAndType(teamId, updateData);
	}

	async findBySubscribedUserIds(userId: string, callerId?: string): Promise<ITeam[]> {
		const unfilteredTeams = await TeamMember.findByUserId<Pick<ITeamMember, 'roles' | 'teamId'>>(userId, {
			projection: { teamId: 1, roles: 1 },
		}).toArray();
		const unfilteredTeamIds = unfilteredTeams.map(({ teamId }) => teamId);

		let teamIds = unfilteredTeamIds;

		if (callerId) {
			const publicTeams = await Team.findByIdsAndType<Pick<ITeam, '_id'>>(unfilteredTeamIds, TEAM_TYPE.PUBLIC, {
				projection: { _id: 1 },
			}).toArray();
			const publicTeamIds = publicTeams.map(({ _id }) => _id);
			const privateTeamIds = unfilteredTeamIds.filter((teamId) => !publicTeamIds.includes(teamId));

			const privateTeams = await TeamMember.findByUserIdAndTeamIds(callerId, privateTeamIds, {
				projection: { teamId: 1 },
			}).toArray();
			const visibleTeamIds = privateTeams.map(({ teamId }) => teamId).concat(publicTeamIds);
			teamIds = unfilteredTeamIds.filter((teamId) => visibleTeamIds.includes(teamId));
		}

		const ownedTeams = unfilteredTeams.filter(({ roles = [] }) => roles.includes('owner')).map(({ teamId }) => teamId);

		const results = await Team.findByIds(teamIds).toArray();
		return results.map((team) => ({
			...team,
			isOwner: ownedTeams.includes(team._id),
		}));
	}

	search(userId: string, term: string | RegExp): Promise<ITeam[]>;

	search(userId: string, term: string | RegExp, options: FindOptions<ITeam>): Promise<ITeam[]>;

	search<P>(userId: string, term: string | RegExp, options: FindOptions<P extends ITeam ? ITeam : P>): Promise<P[]>;

	async search<P>(
		userId: string,
		term: string | RegExp,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<ITeam[] | P[]> {
		if (typeof term === 'string') {
			term = new RegExp(`^${escapeRegExp(term)}`, 'i');
		}

		const userTeams = await TeamMember.findByUserId<Pick<ITeamMember, 'teamId'>>(userId, {
			projection: { teamId: 1 },
		}).toArray();
		const teamIds = userTeams.map(({ teamId }) => teamId);

		return Team.findByNameAndTeamIds(term, teamIds, options || {}).toArray();
	}

	async list(
		uid: string,
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<ITeam> = { sort: {} },
	): Promise<IRecordsWithTotal<ITeamInfo>> {
		const userTeams = await TeamMember.findByUserId<Pick<ITeamMember, 'teamId'>>(uid, {
			projection: { teamId: 1 },
		}).toArray();

		const teamIds = userTeams.map(({ teamId }) => teamId);
		if (teamIds.length === 0) {
			return {
				total: 0,
				records: [],
			};
		}

		const { cursor, totalCount } = Team.findByIdsPaginated(
			teamIds,
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
			query,
		);

		const [records, total] = await Promise.all([cursor.toArray(), totalCount]);

		const results: ITeamInfo[] = [];
		for await (const record of records) {
			const rooms = Rooms.findByTeamId(record._id);
			const users = TeamMember.findByTeamId(record._id);
			results.push({
				...record,
				rooms: await rooms.count(),
				numberOfUsers: await users.count(),
			});
		}

		return {
			total,
			records: results,
		};
	}

	async listAll({ offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeamInfo>> {
		const { cursor, totalCount } = Team.findPaginated(
			{},
			{
				limit: count,
				skip: offset,
			},
		);

		const [records, total] = await Promise.all([cursor.toArray(), totalCount]);

		const results: ITeamInfo[] = [];
		for await (const record of records) {
			const rooms = Rooms.findByTeamId(record._id);
			const users = TeamMember.findByTeamId(record._id);
			results.push({
				...record,
				rooms: await rooms.count(),
				numberOfUsers: await users.count(),
			});
		}

		return {
			total,
			records: results,
		};
	}

	listByNames(names: Array<string>): Promise<ITeam[]>;

	listByNames(names: Array<string>, options: FindOptions<ITeam>): Promise<ITeam[]>;

	listByNames<P>(names: Array<string>, options: FindOptions<P extends ITeam ? ITeam : P>): Promise<P[]>;

	async listByNames<P>(
		names: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P[] | ITeam[]> {
		if (options === undefined) {
			return Team.findByNames(names).toArray();
		}
		return Team.findByNames(names, options).toArray();
	}

	async listByIds(ids: Array<string>, options?: FindOptions<ITeam>): Promise<ITeam[]> {
		return Team.findByIds(ids, options).toArray();
	}

	async addRooms(uid: string, rooms: Array<string>, teamId: string): Promise<Array<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rooms) {
			throw new Error('missing-rooms');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}

		const team = await Team.findOneById<Pick<ITeam, '_id' | 'roomId'>>(teamId, { projection: { _id: 1, roomId: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}

		// at this point, we already checked for the permission
		// so we just need to check if the user can see the room
		const user = await Users.findOneById(uid);
		if (!user) {
			throw new Error('invalid-user');
		}

		const rids = rooms.filter((rid) => rid && typeof rid === 'string');
		const validRooms = await Rooms.findManyByRoomIds(rids).toArray();
		if (validRooms.length < rids.length) {
			throw new Error('invalid-room');
		}

		// validate access for every room first
		for await (const room of validRooms) {
			const canSeeRoom = await Authorization.canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		for await (const room of validRooms) {
			if (room.teamId) {
				throw new Error('room-already-on-team');
			}

			if (!(await Subscriptions.isUserInRole(uid, 'owner', room._id))) {
				throw new Error('error-no-owner-channel');
			}

			if (room.t === 'c') {
				Messages.createUserAddRoomToTeamWithRoomIdAndUser(team.roomId, room.name, user);
			}

			room.teamId = teamId;
		}

		Rooms.setTeamByIds(rids, teamId);
		return validRooms;
	}

	async removeRoom(uid: string, rid: string, teamId: string, canRemoveAnyRoom = false): Promise<IRoom> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}

		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		const user = await Users.findOneById(uid);
		if (!user) {
			throw new Error('invalid-user');
		}
		if (!canRemoveAnyRoom) {
			const canSeeRoom = await Authorization.canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		const team = await Team.findOneById<Pick<ITeam, '_id' | 'roomId'>>(teamId, { projection: { _id: 1, roomId: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}

		if (room.teamId !== teamId) {
			throw new Error('room-not-on-that-team');
		}

		delete room.teamId;
		delete room.teamDefault;
		Rooms.unsetTeamById(room._id);

		if (room.t === 'c') {
			Messages.createUserRemoveRoomFromTeamWithRoomIdAndUser(team.roomId, room.name, user);
		}

		return {
			...room,
		};
	}

	async unsetTeamIdOfRooms(uid: string, teamId: string): Promise<void> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}

		const team = await Team.findOneById<Pick<ITeam, 'roomId'>>(teamId, { projection: { roomId: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}

		const room = await Rooms.findOneById<Pick<IRoom, 'name'>>(team.roomId, { projection: { name: 1 } });
		if (!room) {
			throw new Error('invalid-room');
		}

		const user = await Users.findOneById(uid);

		Messages.createUserConvertTeamToChannelWithRoomIdAndUser(team.roomId, room.name, user);

		await Rooms.unsetTeamId(teamId);
	}

	async updateRoom(uid: string, rid: string, isDefault: boolean, canUpdateAnyRoom = false): Promise<IRoom> {
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}

		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		const user = await Users.findOneById(uid);
		if (!user) {
			throw new Error('invalid-user');
		}
		if (!canUpdateAnyRoom) {
			const canSeeRoom = await Authorization.canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		if (!room.teamId) {
			throw new Error('room-not-on-team');
		}
		room.teamDefault = isDefault;
		Rooms.setTeamDefaultById(rid, isDefault);

		if (room.teamDefault) {
			const teamMembers = await this.members(uid, room.teamId, true, undefined, undefined);

			teamMembers.records.map((m) => addUserToRoom(room._id, m.user, user));
		}

		return {
			...room,
		};
	}

	listTeamsBySubscriberUserId(uid: string): Promise<ITeamMember[]>;

	listTeamsBySubscriberUserId(uid: string, options: FindOptions<ITeamMember>): Promise<ITeamMember[]>;

	listTeamsBySubscriberUserId<P>(uid: string, options: FindOptions<P>): Promise<P[]>;

	listTeamsBySubscriberUserId<P>(
		uid: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P[] | ITeamMember[]> {
		if (options) {
			TeamMember.findByUserId(uid, options).toArray();
		}
		return TeamMember.findByUserId(uid).toArray();
	}

	async listRooms(
		uid: string,
		teamId: string,
		filter: IListRoomsFilter,
		{ offset: skip, count: limit }: IPaginationOptions = { offset: 0, count: 50 },
	): Promise<IRecordsWithTotal<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		const team = await Team.findOneById<Pick<ITeam, '_id' | 'type'>>(teamId, {
			projection: { _id: 1, type: 1 },
		});
		if (!team) {
			throw new Error('invalid-team');
		}

		const { getAllRooms, allowPrivateTeam, name, isDefault } = filter;

		const isMember = await TeamMember.findOneByUserIdAndTeamId(uid, teamId);
		if (team.type === TEAM_TYPE.PRIVATE && !allowPrivateTeam && !isMember) {
			throw new Error('user-not-on-private-team');
		}

		if (getAllRooms) {
			const { cursor, totalCount } = Rooms.findPaginatedByTeamIdContainingNameAndDefault(teamId, name, isDefault, undefined, {
				skip,
				limit,
			});
			const [records, total] = await Promise.all([cursor.toArray(), totalCount]);
			return {
				total,
				records,
			};
		}

		const user = await Users.findOneById<{ __rooms: string[] }>(uid, {
			projection: { __rooms: 1 },
		});
		const userRooms = user?.__rooms;

		const { cursor, totalCount } = Rooms.findPaginatedByTeamIdContainingNameAndDefault(teamId, name, isDefault, userRooms, { skip, limit });

		const [records, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			total,
			records,
		};
	}

	async listRoomsOfUser(
		uid: string,
		teamId: string,
		userId: string,
		allowPrivateTeam: boolean,
		showCanDeleteOnly: boolean,
		{ offset: skip, count: limit }: IPaginationOptions = { offset: 0, count: 50 },
	): Promise<IRecordsWithTotal<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		const team = await Team.findOneById(teamId, {});
		if (!team) {
			throw new Error('invalid-team');
		}
		const isMember = await TeamMember.findOneByUserIdAndTeamId(uid, teamId);
		if (team.type === TEAM_TYPE.PRIVATE && !allowPrivateTeam && !isMember) {
			throw new Error('user-not-on-private-team');
		}

		const teamRooms: (IRoom & {
			userCanDelete?: boolean;
		})[] = await Rooms.findByTeamId(teamId, {
			projection: { _id: 1, t: 1 },
		}).toArray();

		let teamRoomIds: string[];

		if (showCanDeleteOnly) {
			for await (const room of teamRooms) {
				const roomType = room.t;
				const canDeleteRoom = await Authorization.hasPermission(userId, roomType === 'c' ? 'delete-c' : 'delete-p', room._id);
				room.userCanDelete = canDeleteRoom;
			}

			teamRoomIds = teamRooms.filter((room) => (room.t === 'c' || room.t === 'p') && room.userCanDelete).map((room) => room._id);
		} else {
			teamRoomIds = teamRooms.filter((room) => room.t === 'p' || room.t === 'c').map((room) => room._id);
		}

		const subscriptionsCursor = Subscriptions.findByUserIdAndRoomIds(userId, teamRoomIds);
		const subscriptionRoomIds = (await subscriptionsCursor.toArray()).map((subscription) => subscription.rid);
		const { cursor, totalCount } = Rooms.findPaginatedByIds(subscriptionRoomIds, {
			skip,
			limit,
		});

		const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

		const roomData = getSubscribedRoomsForUserWithDetails(userId, false, teamRoomIds);
		const records = [];

		for (const room of rooms) {
			const roomInfo = roomData.find((data) => data.rid === room._id);
			if (!roomInfo) {
				continue;
			}
			room.isLastOwner = roomInfo.userIsLastOwner;
			records.push(room);
		}

		return {
			total,
			records,
		};
	}

	async getMatchingTeamRooms(teamId: string, rids: Array<string>): Promise<Array<string>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}

		if (!rids) {
			return [];
		}

		if (!Array.isArray(rids)) {
			throw new Error('invalid-list-of-rooms');
		}

		const rooms = await Rooms.findByTeamIdAndRoomsId(teamId, rids, {
			projection: { _id: 1 },
		}).toArray();
		return rooms.map(({ _id }: { _id: string }) => _id);
	}

	async getMembersByTeamIds(teamIds: Array<string>, options: FindOptions<ITeamMember>): Promise<Array<ITeamMember>> {
		return TeamMember.findByTeamIds(teamIds, options).toArray();
	}

	async members(
		uid: string,
		teamId: string,
		canSeeAll: boolean,
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		query: Filter<IUser> = {},
	): Promise<IRecordsWithTotal<ITeamMemberInfo>> {
		const isMember = await TeamMember.findOneByUserIdAndTeamId(uid, teamId);
		if (!isMember && !canSeeAll) {
			return {
				total: 0,
				records: [],
			};
		}

		const users = await Users.findActive({ ...query }).toArray();
		const userIds = users.map((m) => m._id);
		const { cursor, totalCount } = TeamMember.findPaginatedMembersInfoByTeamId(teamId, count, offset, {
			userId: { $in: userIds },
		});

		const results: ITeamMemberInfo[] = [];
		for await (const record of cursor) {
			const user = users.find((u) => u._id === record.userId);
			if (!user) {
				continue;
			}

			results.push({
				user: {
					_id: user._id,
					username: user.username,
					name: user.name,
					status: user.status,
					settings: user.settings,
				},
				roles: record.roles,
				createdBy: {
					_id: record.createdBy._id,
					username: record.createdBy.username,
				},
				createdAt: record.createdAt,
			});
		}

		return {
			total: await totalCount,
			records: results,
		};
	}

	async addMembers(uid: string, teamId: string, members: Array<ITeamMemberParams>): Promise<void> {
		const createdBy = (await Users.findOneById(uid, { projection: { username: 1 } })) as Pick<IUser, '_id' | 'username'>;
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		const team = await Team.findOneById<Pick<ITeam, 'roomId'>>(teamId, {
			projection: { roomId: 1 },
		});
		if (!team) {
			throw new Error('team-does-not-exist');
		}

		for await (const member of members) {
			const user = (await Users.findOneById(member.userId, { projection: { username: 1 } })) as Pick<IUser, '_id' | 'username'>;
			await addUserToRoom(team.roomId, user, createdBy, false);

			if (member.roles) {
				await this.addRolesToMember(teamId, member.userId, member.roles);
			}
		}
	}

	async updateMember(teamId: string, member: ITeamMemberParams): Promise<void> {
		if (!member.userId) {
			throw new Error('invalid-user');
		}

		const memberUpdate: Partial<ITeamMember> = {
			roles: member.roles ? member.roles : [],
		};

		const team = await Team.findOneById(teamId);

		if (!team) {
			throw new Error('invalid-team');
		}

		await Promise.all([
			TeamMember.updateOneByUserIdAndTeamId(member.userId, teamId, memberUpdate),
			Subscriptions.updateOne(
				{
					'rid': team?.roomId,
					'u._id': member.userId,
				},
				{
					$set: memberUpdate,
				},
			),
		]);
	}

	async removeMember(teamId: string, userId: string): Promise<void> {
		await TeamMember.deleteByUserIdAndTeamId(userId, teamId);
	}

	async removeMembers(uid: string, teamId: string, members: Array<ITeamMemberParams>): Promise<boolean> {
		const team = await Team.findOneById<Pick<ITeam, 'roomId' | '_id'>>(teamId, {
			projection: { _id: 1, roomId: 1 },
		});
		if (!team) {
			throw new Error('team-does-not-exist');
		}

		const membersIds = members.map((m) => m.userId);
		const usersToRemove = await Users.findByIds(membersIds, {
			projection: { _id: 1, username: 1 },
		}).toArray();
		const byUser = (await Users.findOneById(uid, { projection: { _id: 1, username: 1 } })) as Pick<IUser, '_id' | 'username'>;

		for await (const member of members) {
			if (!member.userId) {
				throw new Error('invalid-user');
			}

			const existingMember = await TeamMember.findOneByUserIdAndTeamId(member.userId, team._id);
			if (!existingMember) {
				throw new Error('member-does-not-exist');
			}

			if (existingMember.roles?.includes('owner')) {
				const owners = TeamMember.findByTeamIdAndRole(team._id, 'owner');
				const totalOwners = await owners.count();
				if (totalOwners === 1) {
					throw new Error('last-owner-can-not-be-removed');
				}
			}

			TeamMember.removeById(existingMember._id);
			const removedUser = usersToRemove.find((u) => u._id === existingMember.userId);
			if (removedUser) {
				await removeUserFromRoom(
					team.roomId,
					removedUser,
					uid !== member.userId
						? {
								byUser,
						  }
						: undefined,
				);
			}
		}

		return true;
	}

	async insertMemberOnTeams(userId: string, teamIds: Array<string>): Promise<void> {
		const inviter = { _id: 'rocket.cat', username: 'rocket.cat' };

		await Promise.all(
			teamIds.map(async (teamId) => {
				const team = await Team.findOneById(teamId);
				const user = await Users.findOneById(userId);

				if (!team || !user) {
					return;
				}

				await addUserToRoom(team.roomId, user, inviter, false);
			}),
		);
	}

	async removeMemberFromTeams(userId: string, teamIds: Array<string>): Promise<void> {
		await Promise.all(
			teamIds.map(async (teamId) => {
				const team = await Team.findOneById(teamId);
				const user = await Users.findOneById(userId);

				if (!team || !user) {
					return;
				}

				await removeUserFromRoom(team.roomId, user);
			}),
		);
	}

	async removeAllMembersFromTeam(teamId: string): Promise<void> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}

		await TeamMember.deleteByTeamId(teamId);
	}

	async addMember(inviter: Pick<IUser, '_id' | 'username'>, userId: string, teamId: string): Promise<boolean> {
		const isAlreadyAMember = await TeamMember.findOneByUserIdAndTeamId(userId, teamId, {
			projection: { _id: 1 },
		});

		if (isAlreadyAMember) {
			return false;
		}

		let inviterData = {} as Pick<IUser, '_id' | 'username'>;
		if (inviter) {
			inviterData = { _id: inviter._id, username: inviter.username };
		}

		await TeamMember.createOneByTeamIdAndUserId(teamId, userId, inviterData);

		await this.addMembersToDefaultRooms(inviter, teamId, [{ userId }]);

		return true;
	}

	getAllPublicTeams(): Promise<ITeam[]>;

	getAllPublicTeams(options: FindOptions<ITeam>): Promise<ITeam[]>;

	async getAllPublicTeams(options?: undefined | FindOptions<ITeam>): Promise<ITeam[]> {
		return options ? Team.findByType(TEAM_TYPE.PUBLIC, options).toArray() : Team.findByType(TEAM_TYPE.PUBLIC).toArray();
	}

	async getOneById(teamId: string, options?: FindOptions<ITeam>): Promise<ITeam | null> {
		if (options === undefined) {
			return Team.findOneById(teamId);
		}
		return Team.findOneById(teamId, options);
	}

	async getOneByName(teamName: string | RegExp): Promise<ITeam | null>;

	async getOneByName(teamName: string | RegExp, options: FindOptions<ITeam>): Promise<ITeam | null>;

	async getOneByName(teamName: string | RegExp, options?: undefined | FindOptions<ITeam>): Promise<ITeam | null> {
		if (!options) {
			return Team.findOneByName(teamName);
		}
		return Team.findOneByName(teamName, options);
	}

	async getOneByMainRoomId(roomId: string): Promise<Pick<ITeam, '_id'> | null> {
		return Team.findOneByMainRoomId<Pick<ITeam, '_id'>>(roomId, {
			projection: { _id: 1 },
		});
	}

	async getOneByRoomId(roomId: string): Promise<ITeam | null> {
		const room = await Rooms.findOneById(roomId);

		if (!room) {
			throw new Error('invalid-room');
		}

		if (!room.teamId) {
			throw new Error('room-not-on-team');
		}

		return Team.findOneById(room.teamId);
	}

	async addRolesToMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await TeamMember.findOneByUserIdAndTeamId(userId, teamId, {
			projection: { _id: 1 },
		});

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!(await TeamMember.updateRolesByTeamIdAndUserId(teamId, userId, roles));
	}

	async removeRolesFromMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await TeamMember.findOneByUserIdAndTeamId(userId, teamId, {
			projection: { _id: 1 },
		});

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!(await TeamMember.removeRolesByTeamIdAndUserId(teamId, userId, roles));
	}

	async getInfoByName(teamName: string): Promise<Omit<ITeam, 'usernames'> | null> {
		return Team.findOne<Omit<ITeam, 'usernames'>>(
			{
				name: teamName,
			},
			{ projection: { usernames: 0 } },
		);
	}

	async getInfoById(teamId: string): Promise<Omit<ITeam, 'usernames'> | null> {
		return Team.findOne<Omit<ITeam, 'usernames'>>(
			{
				_id: teamId,
			},
			{ projection: { usernames: 0 } },
		);
	}

	async addMembersToDefaultRooms(
		inviter: Pick<IUser, '_id' | 'username'>,
		teamId: string,
		members: Array<Pick<ITeamMember, 'userId'>>,
	): Promise<void> {
		const defaultRooms = await Rooms.findDefaultRoomsForTeam(teamId).toArray();
		const users = await Users.findActiveByIds(members.map((member) => member.userId)).toArray();

		defaultRooms.map(async (room) => {
			// at this point, users are already part of the team so we won't check for membership
			for await (const user of users) {
				// add each user to the default room
				addUserToRoom(room._id, user, inviter, false);
			}
		});
	}

	async deleteById(teamId: string): Promise<boolean> {
		return !!(await Team.deleteOneById(teamId));
	}

	async deleteByName(teamName: string): Promise<boolean> {
		return !!(await Team.deleteOneByName(teamName));
	}

	async getStatistics(): Promise<ITeamStats> {
		return {
			totalTeams: await Team.find({}).count(),
			totalRoomsInsideTeams: await Rooms.findRoomsInsideTeams().count(),
			totalDefaultRoomsInsideTeams: await Rooms.findRoomsInsideTeams(true).count(),
		};
	}

	async autocomplete(uid: string, name: string): Promise<ITeamAutocompleteResult[]> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const subscriptions = await Subscriptions.find<Pick<ISubscription, 'rid'>>({ 'u._id': uid }, { projection: { rid: 1 } }).toArray();
		const subscriptionIds = subscriptions.map(({ rid }) => rid);

		const rooms = await Rooms.find<ITeamAutocompleteResult>(
			{
				teamMain: true,
				$and: [
					{
						$or: [
							{
								name: nameRegex,
							},
							{
								fname: nameRegex,
							},
						],
					},
					{
						$or: [
							{
								t: 'c',
							},
							{
								_id: { $in: subscriptionIds },
							},
						],
					},
				],
			},
			{
				projection: {
					fname: 1,
					teamId: 1,
					name: 1,
					t: 1,
					avatarETag: 1,
				},
				limit: 10,
				sort: {
					name: 1,
					fname: 1,
				},
			},
		).toArray();

		return rooms;
	}
}
