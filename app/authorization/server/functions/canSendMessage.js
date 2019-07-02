import { canAccessRoomAsync } from './canAccessRoom';
import { hasPermissionAsync } from './hasPermission';
import { Subscriptions, Rooms } from '../../../models/server/raw';

const subscriptionProjection = {
	blocked: 1,
	blocker: 1,
};

export const canSendMessageAsync = async (rid, { uid, username }, extraData) => {
	const room = await Rooms.findOneById(rid);

	if (!await canAccessRoomAsync(room, { _id: uid, username }, extraData)) {
		throw new Error('error-not-allowed');
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, uid, { subscription: subscriptionProjection });
	if (subscription.blocked || subscription.blocker) {
		throw new Error('room_is_blocked');
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

export const canSendMessage = (rid, { uid, username }, extraData) => Promise.await(canSendMessageAsync(rid, { uid, username }, extraData));
