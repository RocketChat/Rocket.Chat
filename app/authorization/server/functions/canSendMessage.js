import { canAccessRoomAsync } from './canAccessRoom';
import { hasPermissionAsync } from './hasPermission';
import { Subscriptions, Rooms } from '../../../models/server/raw';
import { roomTypes, RoomMemberActions } from '../../../utils/server';

const subscriptionOptions = {
	projection: {
		blocked: 1,
		blocker: 1,
	},
};

export const canSendMessageAsync = async (rid, { uid, username, type }, extraData) => {
	const room = await Rooms.findOneById(rid);

	if (type !== 'app' && !await canAccessRoomAsync(room, { _id: uid, username }, extraData)) {
		throw new Error('error-not-allowed');
	}

	if (roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.BLOCK)) {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, uid, subscriptionOptions);
		if (subscription && (subscription.blocked || subscription.blocker)) {
			throw new Error('room_is_blocked');
		}
	}

	if (room.ro === true && !await hasPermissionAsync(uid, 'post-readonly', rid)) {
		// Unless the user was manually unmuted
		if (!(room.unmuted || []).includes(username)) {
			throw new Error('You can\'t send messages because the room is readonly.');
		}
	}

	if ((room.muted || []).includes(username)) {
		throw new Error('You_have_been_muted');
	}

	return room;
};

export const canSendMessage = (rid, { uid, username, type }, extraData) => Promise.await(canSendMessageAsync(rid, { uid, username, type }, extraData));
