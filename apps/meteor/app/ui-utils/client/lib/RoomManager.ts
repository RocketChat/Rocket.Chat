import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { upsertMessage, RoomHistoryManager } from './RoomHistoryManager';
import { mainReady } from './mainReady';
import { callbacks } from '../../../../lib/callbacks';
import { CachedChatRoom, ChatMessage, ChatSubscription, CachedChatSubscription, ChatRoom } from '../../../models/client';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { RoomManager as NewRoomManager } from '../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { Notifications } from '../../../notifications/client';

const maxRoomsOpen = parseInt(getConfig('maxRoomsOpen') ?? '5') || 5;

const onDeleteMessageStream = (msg: IMessage) => {
	ChatMessage.remove({ _id: msg._id });

	// remove thread refenrece from deleted message
	ChatMessage.update({ tmid: msg._id }, { $unset: { tmid: 1 } }, { multi: true });
};

const onDeleteMessageBulkStream = ({
	rid,
	ts,
	excludePinned,
	ignoreDiscussion,
	users,
}: Pick<IMessage, 'rid' | 'ts'> & {
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	users: IUser[];
}) => {
	const query: Mongo.Query<IMessage> = { rid, ts };
	if (excludePinned) {
		query.pinned = { $ne: true };
	}
	if (ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (users?.length) {
		query['u.username'] = { $in: users };
	}
	ChatMessage.remove(query);
};

const openedRooms: Record<
	string,
	{
		typeName: string;
		rid: IRoom['_id'];
		ready: boolean;
		active: boolean;
		dom?: Node;
		template?: Blaze.View;
		streamActive?: boolean;
		unreadSince: ReactiveVar<Date | undefined>;
		lastSeen: Date;
		unreadFirstId?: string;
	}
> = {};

const roomMessagesStream = new Meteor.Streamer('room-messages');

const openedRoomsDependency = new Tracker.Dependency();

function close(typeName: string) {
	if (openedRooms[typeName]) {
		if (openedRooms[typeName].rid) {
			roomMessagesStream.removeAllListeners(openedRooms[typeName].rid);
			Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessage', onDeleteMessageStream);
			Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessageBulk', onDeleteMessageBulkStream);
		}

		openedRooms[typeName].ready = false;
		openedRooms[typeName].active = false;

		const { template } = openedRooms[typeName];
		if (template) {
			try {
				Blaze.remove(template);
			} catch (e) {
				console.error('Error removing template from DOM', e);
			}
		}
		delete openedRooms[typeName].dom;
		delete openedRooms[typeName].template;

		const { rid } = openedRooms[typeName];
		delete openedRooms[typeName];

		if (rid) {
			NewRoomManager.close(rid);
			return RoomHistoryManager.clear(rid);
		}
	}
}

function closeOlderRooms() {
	if (Object.keys(openedRooms).length <= maxRoomsOpen) {
		return;
	}
	const roomsToClose = Object.values(openedRooms)
		.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
		.slice(maxRoomsOpen);
	return Array.from(roomsToClose).map((roomToClose) => close(roomToClose.typeName));
}

function closeAllRooms() {
	Object.keys(openedRooms).forEach((key) => {
		const openedRoom = openedRooms[key];
		close(openedRoom.typeName);
	});
	Session.set('openedRoom', undefined);
}

function getOpenedRoomByRid(rid: IRoom['_id']) {
	openedRoomsDependency.depend();
	return Object.keys(openedRooms)
		.map((typeName) => openedRooms[typeName])
		.find((openedRoom) => openedRoom.rid === rid);
}

const handleTrackSettingsChange = (msg: IMessage) => {
	const openedRoom = Tracker.nonreactive(() => Session.get('openedRoom'));
	if (openedRoom !== msg.rid) {
		return;
	}

	Tracker.nonreactive(() => {
		if (msg.t === 'room_changed_privacy') {
			const type = FlowRouter.current().route?.name === 'channel' ? 'c' : 'p';
			close(type + FlowRouter.getParam('name'));

			const subscription = ChatSubscription.findOne({ rid: msg.rid });
			const route = subscription.t === 'c' ? 'channel' : 'group';
			FlowRouter.go(route, { name: subscription.name }, FlowRouter.current().queryParams);
		}

		if (msg.t === 'r') {
			const room = ChatRoom.findOne(msg.rid);
			if (room.name !== FlowRouter.getParam('name')) {
				close(room.t + FlowRouter.getParam('name'));
				roomCoordinator.openRouteLink(room.t, room, FlowRouter.current().queryParams);
			}
		}
	});
};

const computation = Tracker.autorun(() => {
	const ready = CachedChatRoom.ready.get() && mainReady.get();
	if (ready !== true) {
		return;
	}
	Tracker.nonreactive(() =>
		Object.entries(openedRooms).forEach(([typeName, record]) => {
			if (record.active !== true || record.ready === true) {
				return;
			}

			const type = typeName.slice(0, 1);
			const name = typeName.slice(1);

			const room = roomCoordinator.getRoomDirectives(type)?.findRoom(name);

			RoomHistoryManager.getMoreIfIsEmpty(record.rid);

			if (room) {
				if (record.streamActive !== true) {
					(
						roomMessagesStream.on(record.rid, async (msg) => {
							// Should not send message to room if room has not loaded all the current messages
							// if (RoomHistoryManager.hasMoreNext(record.rid) !== false) {
							// 	return;
							// }
							// Do not load command messages into channel
							if (msg.t !== 'command') {
								const subscription = ChatSubscription.findOne({ rid: record.rid }, { reactive: false });
								const isNew = !ChatMessage.findOne({ _id: msg._id, temp: { $ne: true } });
								upsertMessage({ msg, subscription });

								msg.room = {
									type,
									name,
								};
								if (isNew) {
									callbacks.run('streamNewMessage', msg);
								}
							}

							msg.name = room.name || '';

							handleTrackSettingsChange(msg);

							callbacks.run('streamMessage', msg);

							return fireGlobalEvent('new-message', msg);
						}) as unknown as Promise<void>
					).then(() => {
						record.streamActive = true;
						openedRoomsDependency.changed();
					});
					Notifications.onRoom(record.rid, 'deleteMessage', onDeleteMessageStream);
					Notifications.onRoom(record.rid, 'deleteMessageBulk', onDeleteMessageBulkStream);
				}
			}

			record.ready = true;
		}),
	);
	openedRoomsDependency.changed();
});

function open({ typeName, rid }: { typeName: string; rid: IRoom['_id'] }) {
	if (!openedRooms[typeName]) {
		openedRooms[typeName] = {
			typeName,
			rid,
			active: false,
			ready: false,
			unreadSince: new ReactiveVar(undefined),
			lastSeen: new Date(),
		};
	}

	openedRooms[typeName].lastSeen = new Date();

	if (openedRooms[typeName].ready) {
		closeOlderRooms();
	}

	if (CachedChatSubscription.ready.get() === true) {
		if (openedRooms[typeName].active !== true) {
			openedRooms[typeName].active = true;
			if (computation) {
				computation.invalidate();
			}
		}
	}

	return {
		ready() {
			openedRoomsDependency.depend();
			return openedRooms[typeName].ready;
		},
	};
}

let openedRoom: string | undefined = undefined;

let currentTracker: Tracker.Computation | undefined = undefined;

export const RoomManager = {
	get openedRoom() {
		return openedRoom;
	},

	set openedRoom(rid) {
		openedRoom = rid;
	},

	get openedRooms() {
		return openedRooms;
	},

	getOpenedRoomByRid,

	close,

	closeAllRooms,

	get computation() {
		return computation;
	},

	open,

	get currentTracker() {
		return currentTracker;
	},

	set currentTracker(tracker) {
		currentTracker = tracker;
	},
};
