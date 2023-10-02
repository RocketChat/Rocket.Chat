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
							let cachedMessage: any;
							if (msg.t !== 'command') {
								if (msg.delta) {
									const set: Record<string, any> = {};

									for (const [key, value] of Object.entries(msg.delta.update ?? {})) {
										if (key.startsWith('reactions.') && Array.isArray(value)) {
											const emoji = key.split('.')[1];
											const map = new Map();

											value.forEach((username) => map.set(username, true));

											cachedMessage = ChatMessage.findOne({ _id: msg._id });
											if (!cachedMessage) {
												console.warn('[WARN] no message found in cache while delta was sent');
												return;
											}

											const emojiReactions = cachedMessage.reactions?.[emoji];
											const { names, usernames } = emojiReactions as any;

											for (let i = 0; i < usernames.length; i++) {
												if (!map.has(usernames[i])) {
													usernames.splice(i, 1);
													names.splice(i, 1);
													break;
												}
											}

											set[`reactions.${emoji}.usernames`] = usernames;
											set[`reactions.${emoji}.names`] = names;

											continue;
										}

										set[key] = value;
									}

									const unset =
										msg.delta.removeFields?.reduce((acc, curr) => {
											return { ...acc, [curr]: 1 };
										}, {}) ?? {};

									const n = ChatMessage.update(
										{ _id: msg._id },
										{ ...(msg.delta.update && { $set: set }), ...(msg.delta.removeFields?.length && { $unset: unset }) },
									);
									if (n !== 1) {
										console.warn('[WARN] no message found in cache while delta was sent');
										return;
									}

									cachedMessage = ChatMessage.findOne({ _id: msg._id });
								} else {
									const subscription = ChatSubscription.findOne({ rid: record.rid }, { reactive: false });
									await upsertMessage({ msg, subscription });

									await callbacks.run('streamNewMessage', msg);
								}
							}

							cachedMessage = cachedMessage ?? msg;

							handleTrackSettingsChange({ ...cachedMessage });

							await callbacks.run('streamMessage', { ...cachedMessage, name: room.name || '' });

							fireGlobalEvent('new-message', {
								...cachedMessage,
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
					Notifications.onRoom(record.rid, 'deleteMessageBulk', ({ rid, ts, excludePinned, ignoreDiscussion, users }) => {
						const query: Mongo.Selector<IMessage> = { rid, ts };
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
}; //
