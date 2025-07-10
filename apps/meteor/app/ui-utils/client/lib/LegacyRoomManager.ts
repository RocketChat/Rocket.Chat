import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { Filter } from '@rocket.chat/mongo-adapter';

import { upsertMessage, RoomHistoryManager } from './RoomHistoryManager';
import { RoomManager } from '../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { callbacks } from '../../../../lib/callbacks';
import { Messages, Subscriptions } from '../../../models/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

const maxRoomsOpen = parseInt(getConfig('maxRoomsOpen') ?? '5') || 5;

type ListenRoomPropsByRidProps = keyof OpenedRoom;
type ListenRoomPropsByRidPropsEvent = `${string}/${ListenRoomPropsByRidProps}`;

const listener = new Emitter<{
	[key in ListenRoomPropsByRidPropsEvent]: undefined;
}>();

type OpenedRoom = {
	typeName: string;
	rid: IRoom['_id'];
	ready: boolean;
	dom?: Node;
	streamActive?: boolean;
	unreadSince: Date | undefined;
	lastSeen: Date;
	unreadFirstId?: string;
	stream?: {
		stop: () => void;
	};
};

const openedRooms: Record<string, OpenedRoom> = {};

function close(typeName: string) {
	if (openedRooms[typeName]) {
		openedRooms[typeName].stream?.stop();

		openedRooms[typeName].ready = false;

		delete openedRooms[typeName].dom;

		const { rid } = openedRooms[typeName];
		delete openedRooms[typeName];

		if (rid) {
			RoomManager.close(rid);
			return RoomHistoryManager.close(rid);
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

function listenRoomPropsByRid<T extends ListenRoomPropsByRidProps>(
	rid: IRoom['_id'],
	prop: T,
): {
	subscribe: (cb: () => void) => () => void;
	getSnapshotValue: () => OpenedRoom[T];
} {
	return {
		subscribe: (cb: () => void) => {
			return listener.on(`${rid}/${prop}`, cb);
		},
		getSnapshotValue: (): OpenedRoom[T] => {
			return getOpenedRoomByRid(rid)?.[prop] as OpenedRoom[T];
		},
	};
}

function setPropertyByRid<T extends ListenRoomPropsByRidProps>(room: OpenedRoom, prop: T, value: OpenedRoom[T]): OpenedRoom[T] | undefined;
function setPropertyByRid<T extends ListenRoomPropsByRidProps>(rid: IRoom['_id'], prop: T, value: OpenedRoom[T]): OpenedRoom[T] | undefined;
function setPropertyByRid<T extends ListenRoomPropsByRidProps>(
	ridOrRoom: IRoom['_id'] | OpenedRoom,
	prop: T,
	value: OpenedRoom[T],
): OpenedRoom[T] | undefined {
	const room = typeof ridOrRoom === 'string' ? getOpenedRoomByRid(ridOrRoom) : ridOrRoom;
	const rid = typeof ridOrRoom === 'string' ? ridOrRoom : room?.rid;
	if (!room) {
		return;
	}
	room[prop] = value;
	listener.emit(`${rid}/${prop}`);
}

function getOpenedRoomByRid(rid: IRoom['_id']) {
	return Object.keys(openedRooms)
		.map((typeName) => openedRooms[typeName])
		.find((openedRoom) => openedRoom.rid === rid);
}

const openRoom = (typeName: string, record: OpenedRoom) => {
	if (record.ready === true && record.streamActive === true) {
		return;
	}

	if (record.streamActive === true) {
		return;
	}

	const type = typeName.slice(0, 1);
	const name = typeName.slice(1);

	const room = roomCoordinator.getRoomDirectives(type).findRoom(name);

	if (!room) {
		return;
	}

	const streams: ReturnType<typeof sdk.stream>[] = [];

	streams.push(
		...[
			sdk.stream('room-messages', [record.rid], async (msg) => {
				// Should not send message to room if room has not loaded all the current messages
				// if (RoomHistoryManager.hasMoreNext(record.rid) !== false) {
				// 	return;
				// }
				// Do not load command messages into channel
				if (msg.t !== 'command') {
					const subscription = Subscriptions.findOne({ rid: record.rid }, { reactive: false });
					const isNew = !Messages.state.find((record) => record._id === msg._id && record.temp !== true);
					({ _id: msg._id, temp: { $ne: true } });
					await upsertMessage({ msg, subscription });
					if (isNew) {
						await callbacks.run('streamNewMessage', msg);
					}
				}

				await callbacks.run('streamMessage', { ...msg, name: room.name || '' });

				fireGlobalEvent('new-message', {
					...msg,
					name: room.name || '',
					room: {
						type,
						name,
					},
				});
			}),

			// when we receive a messages imported event we just clear the room history and fetch it again
			sdk.stream('notify-room', [`${record.rid}/messagesImported`], async () => {
				await RoomHistoryManager.clear(record.rid);
				await RoomHistoryManager.getMore(record.rid);
			}),
			sdk.stream('notify-room', [`${record.rid}/deleteMessage`], (msg) => {
				Messages.state.delete(msg._id);

				// remove thread refenrece from deleted message
				Messages.state.update(
					(record) => record.tmid === msg._id,
					({ tmid: _, ...record }) => record,
				);
			}),
			sdk.stream(
				'notify-room',
				[`${record.rid}/deleteMessageBulk`],
				({ rid, ts, excludePinned, ignoreDiscussion, users, ids, showDeletedStatus }) => {
					const query: Filter<IMessage> = { rid };

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

					const predicate = createPredicateFromFilter(query);

					if (showDeletedStatus) {
						return Messages.state.update(predicate, (record) => ({
							...record,
							t: 'rm',
							msg: '',
							urls: [],
							mentions: [],
							attachments: [],
							reactions: {},
						}));
					}

					return Messages.state.remove(predicate);
				},
			),

			sdk.stream('notify-room', [`${record.rid}/messagesRead`], ({ tmid, until }) => {
				if (tmid) {
					Messages.state.update(
						(record) => record.tmid === tmid && record.unread === true,
						({ unread: _, ...record }) => record,
					);
					return;
				}
				Messages.state.update(
					(r) =>
						r.rid === record.rid && r.unread === true && r.ts.getTime() < until.getTime() && (r.tmid === undefined || r.tshow === true),
					({ unread: _, ...r }) => r,
				);
			}),
		],
	);

	const [streamRoomMessages] = streams;

	void streamRoomMessages.ready().then(() => {
		setPropertyByRid(record.rid, 'streamActive', true);
	});

	record.stream = {
		stop: () => {
			streams.forEach((stream) => stream.stop());
		},
	};

	record.ready = true;
};

function open({ typeName, rid }: { typeName: string; rid: IRoom['_id'] }) {
	if (!openedRooms[typeName]) {
		openedRooms[typeName] = {
			typeName,
			rid,
			ready: false,
			unreadSince: undefined,
			lastSeen: new Date(),
		};
	}

	openedRooms[typeName].lastSeen = new Date();

	if (openedRooms[typeName].ready) {
		closeOlderRooms();
	}

	openRoom(typeName, openedRooms[typeName]);
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
	listenRoomPropsByRid,
	setPropertyByRid,
	getOpenedRoomByRid,

	close,

	closeAllRooms,

	open,
};
