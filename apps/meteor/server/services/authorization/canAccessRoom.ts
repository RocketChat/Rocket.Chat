import { Authorization, License, Abac, Settings } from '@rocket.chat/core-services';
import type { RoomAccessValidator } from '@rocket.chat/core-services';
import { TeamType, AbacAccessOperation, AbacObjectType } from '@rocket.chat/core-typings';
import type { IUser, ITeam, IRoom } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, TeamMember, Team, Users } from '@rocket.chat/models';

import { canAccessRoomLivechat } from './canAccessRoomLivechat';

async function canAccessPublicRoom(user?: Partial<IUser>): Promise<boolean> {
	if (!user?._id) {
		const anon = await Settings.get<boolean>('Accounts_AllowAnonymousRead');
		return !!anon;
	}

	return Authorization.hasPermission(user._id, 'view-c-room');
}

type RoomAccessValidatorConverted = (
	room?: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
	user?: IUser,
	extraData?: Record<string, any>,
) => Promise<boolean>;

const roomAccessValidators: RoomAccessValidatorConverted[] = [
	async function _validateAccessToPublicRoomsInTeams(room, user): Promise<boolean> {
		if (!room) {
			return false;
		}
		if (!room._id || !room.teamId || room.t !== 'c') {
			// if the room doesn't belongs to a team || is not a public channel - skip
			return false;
		}

		// if team is public, access is allowed if the user can access public rooms
		const team = await Team.findOneById<Pick<ITeam, 'type'>>(room.teamId, {
			projection: { type: 1 },
		});
		if (team?.type === TeamType.PUBLIC) {
			return canAccessPublicRoom(user);
		}

		// otherwise access is allowed only to members of the team
		const membership =
			user?._id &&
			(await TeamMember.findOneByUserIdAndTeamId(user._id, room.teamId, {
				projection: { _id: 1 },
			}));
		return !!membership;
	},

	async function _validateAccessToPublicRooms(room, user): Promise<boolean> {
		if (!room?._id || room.t !== 'c' || room?.teamId) {
			return false;
		}

		return canAccessPublicRoom(user);
	},

	async function _validateIfAlreadyJoined(room, user, extraData): Promise<boolean> {
		if (!room?._id || !user?._id) {
			return false;
		}

		const [canViewJoined, canViewT] = await Promise.all([
			Authorization.hasPermission(user, 'view-joined-room'),
			Authorization.hasPermission(user, `view-${room.t}-room`),
		]);

		// When there's no ABAC setting, license or values on the room, fallback to previous behavior
		if (!room?.abacAttributes?.length || !(await License.hasModule('abac')) || !(await Settings.get<boolean>('ABAC_Enabled'))) {
			const includeInvitations = extraData?.includeInvitations ?? false;
			if (!(await Subscriptions.countByRoomIdAndUserId(room._id, user._id, includeInvitations))) {
				return false;
			}

			return canViewJoined || canViewT;
		}

		return (canViewJoined || canViewT) && Abac.canAccessObject(room, user, AbacAccessOperation.READ, AbacObjectType.ROOM);
	},

	async function _validateAccessToDiscussionsParentRoom(room, user): Promise<boolean> {
		if (!room?.prid) {
			return false;
		}

		const parentRoom = await Rooms.findOneById(room.prid);
		if (!parentRoom) {
			return false;
		}

		return Authorization.canAccessRoom(parentRoom, user);
	},

	canAccessRoomLivechat,
];

export const isPartialUser = (user: IUser | Pick<IUser, '_id'> | undefined): user is Pick<IUser, '_id'> => {
	return Boolean(user && Object.keys(user).length === 1 && '_id' in user);
};

export const canAccessRoom: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// TODO livechat can send both as null, so they we need to validate nevertheless
	// if (!room || !user) {
	// 	return false;
	// }

	// TODO: remove this after migrations
	// if user only contains _id, convert it to a full IUser object

	if (isPartialUser(user)) {
		user = (await Users.findOneById(user._id)) || undefined;
		if (!user) {
			throw new Error('User not found');
		}

		if (process.env.NODE_ENV === 'development') {
			console.log('User converted to full IUser object');
		}
	}

	for await (const roomAccessValidator of roomAccessValidators) {
		if (await roomAccessValidator(room, user as IUser, extraData)) {
			return true;
		}
	}

	return false;
};
