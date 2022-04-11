// import { IRoom } from '../../../../definition/IRoom';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
// TODO: add return type
export const getRoomDirectives = (room) => {
	const roomDirectives = room?.t && roomCoordinator.getRoomDirectives(room.t);

	const [roomCanSetOwner, roomCanSetLeader, roomCanSetModerator, roomCanIgnore, roomCanBlock, roomCanMute, roomCanRemove] = [
		...(roomDirectives && [
			roomDirectives.allowMemberAction(room, RoomMemberActions.SET_AS_OWNER),
			roomDirectives.allowMemberAction(room, RoomMemberActions.SET_AS_LEADER),
			roomDirectives.allowMemberAction(room, RoomMemberActions.SET_AS_MODERATOR),
			roomDirectives.allowMemberAction(room, RoomMemberActions.IGNORE),
			roomDirectives.allowMemberAction(room, RoomMemberActions.BLOCK),
			roomDirectives.allowMemberAction(room, RoomMemberActions.MUTE),
			roomDirectives.allowMemberAction(room, RoomMemberActions.REMOVE_USER),
		]),
	];

	return [roomCanSetOwner, roomCanSetLeader, roomCanSetModerator, roomCanIgnore, roomCanBlock, roomCanMute, roomCanRemove];
};
