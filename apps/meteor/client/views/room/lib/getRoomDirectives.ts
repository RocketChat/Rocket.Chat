import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type getRoomDirectiesType = {
	roomCanSetOwner: boolean;
	roomCanSetLeader: boolean;
	roomCanSetModerator: boolean;
	roomCanIgnore: boolean;
	roomCanBlock: boolean;
	roomCanMute: boolean;
	roomCanRemove: boolean;
};

export const getRoomDirectives = ({
	room,
	showingUserId,
	userSubscription,
}: {
	room: IRoom;
	showingUserId: IUser['_id'];
	userSubscription?: ISubscription;
}): getRoomDirectiesType => {
	const roomDirectives = room?.t && roomCoordinator.getRoomDirectives(room.t);

	const [roomCanSetOwner, roomCanSetLeader, roomCanSetModerator, roomCanIgnore, roomCanBlock, roomCanMute, roomCanRemove] = [
		...((roomDirectives && [
			roomDirectives.allowMemberAction(room, RoomMemberActions.SET_AS_OWNER, showingUserId, userSubscription),
			roomDirectives.allowMemberAction(room, RoomMemberActions.SET_AS_LEADER, showingUserId, userSubscription),
			roomDirectives.allowMemberAction(room, RoomMemberActions.SET_AS_MODERATOR, showingUserId, userSubscription),
			roomDirectives.allowMemberAction(room, RoomMemberActions.IGNORE, showingUserId, userSubscription),
			roomDirectives.allowMemberAction(room, RoomMemberActions.BLOCK, showingUserId, userSubscription),
			roomDirectives.allowMemberAction(room, RoomMemberActions.MUTE, showingUserId, userSubscription),
			roomDirectives.allowMemberAction(room, RoomMemberActions.REMOVE_USER, showingUserId, userSubscription),
		]) ??
			[]),
	];

	return { roomCanSetOwner, roomCanSetLeader, roomCanSetModerator, roomCanIgnore, roomCanBlock, roomCanMute, roomCanRemove };
};
