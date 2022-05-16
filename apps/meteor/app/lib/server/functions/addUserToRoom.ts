import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import type { IUser, IRoom } from '@rocket.chat/core-typings';

import { AppEvents, Apps } from '../../../apps/server';
import { callbacks } from '../../../../lib/callbacks';
import { Messages, Rooms, Subscriptions } from '../../../models/server';
import { Team } from '../../../../server/sdk';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

export const addUserToRoom = function (
	rid: string,
	user: Pick<IUser, '_id' | 'username'>,
	inviter?: Pick<IUser, '_id' | 'username'>,
	silenced?: boolean,
): boolean | unknown {
	const now = new Date();
	const room: IRoom = Rooms.findOneById(rid);

	const roomDirectives = roomCoordinator.getRoomDirectives(room.t);
	if (
		!roomDirectives?.allowMemberAction(room, RoomMemberActions.JOIN) &&
		!roomDirectives?.allowMemberAction(room, RoomMemberActions.INVITE)
	) {
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

	Promise.await(
		Apps.triggerEvent(AppEvents.IPreRoomUserJoined, room, user, inviter).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}),
	);

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
			const extraData = {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username,
				},
			};
			if (room.teamMain) {
				Messages.createUserAddedToTeamWithRoomIdAndUser(rid, user, extraData);
			} else {
				Messages.createUserAddedWithRoomIdAndUser(rid, user, extraData);
			}
		} else if (room.prid) {
			Messages.createUserJoinWithRoomIdAndUserDiscussion(rid, user, { ts: now });
		} else if (room.teamMain) {
			Messages.createUserJoinTeamWithRoomIdAndUser(rid, user, { ts: now });
		} else {
			Messages.createUserJoinWithRoomIdAndUser(rid, user, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		Meteor.defer(function () {
			// Add a new event, with an optional inviter
			callbacks.run('afterAddedToRoom', { user, inviter }, room);

			// Keep the current event
			callbacks.run('afterJoinRoom', user, room);

			Apps.triggerEvent(AppEvents.IPostRoomUserJoined, room, user, inviter);
		});
	}

	if (room.teamMain && room.teamId && inviter) {
		// if user is joining to main team channel, create a membership
		Promise.await(Team.addMember(inviter, user._id, room.teamId));
	}

	return true;
};
