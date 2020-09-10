import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';

import { AppEvents, Apps } from '../../../apps/server';
import { callbacks } from '../../../callbacks';
import { Messages, Rooms, Subscriptions } from '../../../models';
import { RoomMemberActions, roomTypes } from '../../../utils/server';

export const addUserToRoom = function(rid, user, inviter, silenced) {
	const now = new Date();
	const room = Rooms.findOneById(rid);

	const roomConfig = roomTypes.getConfig(room.t);
	if (!roomConfig.allowMemberAction(room, RoomMemberActions.JOIN) && !roomConfig.allowMemberAction(room, RoomMemberActions.INVITE)) {
		return;
	}

	// Check if user is already in room
	const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (subscription) {
		return;
	}

	try {
		Promise.await(Apps.triggerEvent(AppEvents.IPreRoomUserJoined, room, user, inviter));
	} catch (error) {
		if (error instanceof AppsEngineException) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	if (room.t === 'c' || room.t === 'p' || room.t === 'l') {
		// Add a new event, with an optional inviter
		callbacks.run('beforeAddedToRoom', { user, inviter }, room);

		// Keep the current event
		callbacks.run('beforeJoinRoom', user, room);
	}

	Promise.await(Apps.triggerEvent(AppEvents.IPreRoomUserJoined, room, user, inviter).catch((error) => {
		if (error instanceof AppsEngineException) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}));

	Subscriptions.createWithRoomAndUser(room, user, {
		ts: now,
		open: true,
		alert: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
	});

	if (!silenced) {
		if (inviter) {
			Messages.createUserAddedWithRoomIdAndUser(rid, user, {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username,
				},
			});
		} else if (room.prid) {
			Messages.createUserJoinWithRoomIdAndUserDiscussion(rid, user, { ts: now });
		} else {
			Messages.createUserJoinWithRoomIdAndUser(rid, user, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		Meteor.defer(function() {
			// Add a new event, with an optional inviter
			callbacks.run('afterAddedToRoom', { user, inviter }, room);

			// Keep the current event
			callbacks.run('afterJoinRoom', user, room);

			Apps.triggerEvent(AppEvents.IPostRoomUserJoined, room, user, inviter);
		});
	}

	return true;
};
