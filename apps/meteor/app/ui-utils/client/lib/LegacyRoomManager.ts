import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { RoomManager } from '../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { router } from '../../../../client/providers/RouterProvider';
import { callbacks } from '../../../../lib/callbacks';
import { CachedChatRoom, ChatMessage, ChatSubscription, CachedChatSubscription, ChatRoom } from '../../../models/client';
import { Notifications } from '../../../notifications/client';
import { sdk } from '../../../utils/client/lib/SDKClient';
import { upsertMessage, RoomHistoryManager } from './RoomHistoryManager';
import { mainReady } from './mainReady';

const maxRoomsOpen = parseInt(getConfig('maxRoomsOpen') ?? '5') || 5;

const openedRooms: Record<
	string,
	{
		typeName: string;
		rid: IRoom['_id'];
		ready: boolean;
		active: boolean;
		dom?: Node;
		streamActive?: boolean;
		unreadSince: ReactiveVar<Date | undefined>;
		lastSeen: Date;
		unreadFirstId?: string;
	}
> = {};

const openedRoomsDependency = new Tracker.Dependency();

function close(typeName: string) {
	if (openedRooms[typeName]) {
		if (openedRooms[typeName].rid) {
			sdk.stop('room-messages', openedRooms[typeName].rid);
			Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessage');
			Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessageBulk');
		}

		openedRooms[typeName].ready = false;
		openedRooms[typeName].active = false;

		delete openedRooms[typeName].dom;

		const { rid } = openedRooms[typeName];
		delete openedRooms[typeName];

		if (rid) {
			RoomManager.close(rid);
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

async function closeAllRooms() {
	for await (const openedRoom of Object.values(openedRooms)) {
		await close(openedRoom.typeName);
	}
}

function getOpenedRoomByRid(rid: IRoom['_id']) {
	openedRoomsDependency.depend();
	return Object.keys(openedRooms)
		.map((typeName) => openedRooms[typeName])
		.find((openedRoom) => openedRoom.rid === rid);
}

const handleTrackSettingsChange = (msg: IMessage) => {
	const openedRoom = RoomManager.opened;
	if (openedRoom !== msg.rid) {
		return;
	}

	void Tracker.nonreactive(async () => {
		if (msg.t === 'room_changed_privacy') {
			const type = router.getRouteName() === 'channel' ? 'c' : 'p';
			await close(type + router.getRouteParameters().name);

			const subscription = ChatSubscription.findOne({ rid: msg.rid });
			if (!subscription) {
				throw new Error('Subscription not found');
			}
			router.navigate({
				pattern: subscription.t === 'c' ? '/channel/:name/:tab?/:context?' : '/group/:name/:tab?/:context?',
				params: { name: subscription.name },
				search: router.getSearchParameters(),
			});
		}

		if (msg.t === 'r') {
			const room = ChatRoom.findOne(msg.rid);
			if (!room) {
				throw new Error('Room not found');
			}
			if (room.name !== router.getRouteParameters().name) {
				await close(room.t + router.getRouteParameters().name);
				roomCoordinator.openRouteLink(room.t, room, router.getSearchParameters());
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

			const room = roomCoordinator.getRoomDirectives(type).findRoom(name);

			void RoomHistoryManager.getMoreIfIsEmpty(record.rid);

			if (room) {
				if (record.streamActive !== true) {
					void sdk
						.stream('room-messages', [record.rid], async (msg) => {
							// Should not send message to room if room has not loaded all the current messages
							// if (RoomHistoryManager.hasMoreNext(record.rid) !== false) {
							// 	return;
							// }
							// Do not load command messages into channel
							if (msg.t !== 'command') {
								const subscription = ChatSubscription.findOne({ rid: record.rid }, { reactive: false });
								const isNew = !ChatMessage.findOne({ _id: msg._id, temp: { $ne: true } });
								await upsertMessage({ msg, subscription });

								if (isNew) {
									await callbacks.run('streamNewMessage', msg);
								}
							}

							handleTrackSettingsChange({ ...msg });

							await callbacks.run('streamMessage', { ...msg, name: room.name || '' });

							fireGlobalEvent('new-message', {
								...msg,
								name: room.name || '',
								room: {
									type,
									name,
								},
							});
						})

						.ready()
						.then(() => {
							record.streamActive = true;
							openedRoomsDependency.changed();
						});
					Notifications.onRoom(record.rid, 'deleteMessage', (msg) => {
						ChatMessage.remove({ _id: msg._id });

						// remove thread refenrece from deleted message
						ChatMessage.update({ tmid: msg._id }, { $unset: { tmid: 1 } }, { multi: true });
					});
					Notifications.onRoom(
						record.rid,
						'deleteMessageBulk',
						({ rid, ts, excludePinned, ignoreDiscussion, users, ids, showDeletedStatus }) => {
							const query: Mongo.Selector<IMessage> = { rid };

							if (ids) {
								query._id = { $in: ids };
							} else {
								query.ts = ts;
							}
							if (excludePinned) {
								query.pinned = { $ne: true };
							}
							if (ignoreDiscussion) {
								query.drid = { $exists: false };
							}
							if (users?.length) {
								query['u.username'] = { $in: users };
							}

							if (showDeletedStatus) {
								return ChatMessage.update(
									query,
									{ $set: { t: 'rm', msg: '', urls: [], mentions: [], attachments: [], reactions: {} } },
									{ multi: true },
								);
							}
							return ChatMessage.remove(query);
						},
					);
					Notifications.onRoom(record.rid, 'messagesRead', ({ rid, tmid, until }) => {
						if (tmid) {
							return ChatMessage.update(
								{
									$or: [{ tmid }, { _id: tmid }],
									unread: true,
								},
								{ $unset: { unread: 1 } },
								{ multi: true },
							);
						}
						ChatMessage.update(
							{
								rid,
								unread: true,
								...(until && { ts: { $lt: until } }),
								$or: [
									{
										tmid: { $exists: false },
									},
									{
										tshow: true,
									},
								],
							},
							{ $unset: { unread: 1 } },
							{ multi: true },
						);
					});
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

export const LegacyRoomManager = {
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
};
