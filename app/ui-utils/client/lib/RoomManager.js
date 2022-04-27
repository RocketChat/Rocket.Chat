import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import _ from 'underscore';

import { fireGlobalEvent } from '../../../../client/lib/utils/fireGlobalEvent';
import { upsertMessage, RoomHistoryManager } from './RoomHistoryManager';
import { mainReady } from './mainReady';
import { callbacks } from '../../../../lib/callbacks';
import { Notifications } from '../../../notifications';
import { CachedChatRoom, ChatMessage, ChatSubscription, CachedChatSubscription, ChatRoom } from '../../../models';
import { CachedCollectionManager } from '../../../ui-cached-collection';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { ROOM_DATA_STREAM } from '../../../utils/stream/constants';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { RoomManager as NewRoomManager } from '../../../../client/lib/RoomManager';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

const maxRoomsOpen = parseInt(getConfig('maxRoomsOpen')) || 5;

const onDeleteMessageStream = (msg) => {
	ChatMessage.remove({ _id: msg._id });

	// remove thread refenrece from deleted message
	ChatMessage.update({ tmid: msg._id }, { $unset: { tmid: 1 } }, { multi: true });
};
const onDeleteMessageBulkStream = ({ rid, ts, excludePinned, ignoreDiscussion, users }) => {
	const query = { rid, ts };
	if (excludePinned) {
		query.pinned = { $ne: true };
	}
	if (ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (users && users.length) {
		query['u.username'] = { $in: users };
	}
	ChatMessage.remove(query);
};

export const RoomManager = new (function () {
	const openedRooms = {};
	const msgStream = new Meteor.Streamer('room-messages');
	const roomStream = new Meteor.Streamer(ROOM_DATA_STREAM);
	const onlineUsers = new ReactiveVar({});
	const Dep = new Tracker.Dependency();

	const handleTrackSettingsChange = (msg) => {
		const openedRoom = Tracker.nonreactive(() => Session.get('openedRoom'));
		if (openedRoom !== msg.rid) {
			return;
		}

		Tracker.nonreactive(() => {
			if (msg.t === 'room_changed_privacy') {
				const type = FlowRouter.current().route.name === 'channel' ? 'c' : 'p';
				RoomManager.close(type + FlowRouter.getParam('name'));

				const subscription = ChatSubscription.findOne({ rid: msg.rid });
				const route = subscription.t === 'c' ? 'channel' : 'group';
				FlowRouter.go(route, { name: subscription.name }, FlowRouter.current().queryParams);
			}

			if (msg.t === 'r') {
				const room = ChatRoom.findOne(msg.rid);
				if (room.name !== FlowRouter.getParam('name')) {
					RoomManager.close(room.t + FlowRouter.getParam('name'));
					roomCoordinator.openRouteLink(room.t, room, FlowRouter.current().queryParams);
				}
			}
		});
	};

	const Cls = class {
		static initClass() {
			this.prototype.openedRooms = openedRooms;
			this.prototype.onlineUsers = onlineUsers;
			this.prototype.roomStream = roomStream;
			this.prototype.computation = Tracker.autorun(() => {
				const ready = CachedChatRoom.ready.get() && mainReady.get();
				if (ready !== true) {
					return;
				}
				Tracker.nonreactive(() =>
					Object.entries(openedRooms).forEach(([typeName, record]) => {
						if (record.active !== true || record.ready === true) {
							return;
						}

						const type = typeName.substr(0, 1);
						const name = typeName.substr(1);

						const room = roomCoordinator.getRoomDirectives(type)?.findRoom(name);

						RoomHistoryManager.getMoreIfIsEmpty(record.rid);

						if (room != null) {
							if (record.streamActive !== true) {
								record.streamActive = true;
								msgStream.on(record.rid, async (msg) => {
									// Should not send message to room if room has not loaded all the current messages
									if (RoomHistoryManager.hasMoreNext(record.rid) !== false) {
										return;
									}
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

									msg.name = room.name;
									Tracker.afterFlush(() => RoomManager.updateMentionsMarksOfRoom(typeName));

									handleTrackSettingsChange(msg);

									callbacks.run('streamMessage', msg);

									return fireGlobalEvent('new-message', msg);
								});
								Notifications.onRoom(record.rid, 'deleteMessage', onDeleteMessageStream); // eslint-disable-line no-use-before-define
								Notifications.onRoom(record.rid, 'deleteMessageBulk', onDeleteMessageBulkStream); // eslint-disable-line no-use-before-define
							}
						}

						record.ready = true;
					}),
				);
				Dep.changed();
			});
		}

		getOpenedRoomByRid(rid) {
			return Object.keys(openedRooms)
				.map((typeName) => openedRooms[typeName])
				.find((openedRoom) => openedRoom.rid === rid);
		}

		close(typeName) {
			if (openedRooms[typeName]) {
				if (openedRooms[typeName].rid != null) {
					msgStream.removeAllListeners(openedRooms[typeName].rid);
					Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessage', onDeleteMessageStream); // eslint-disable-line no-use-before-define
					Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessageBulk', onDeleteMessageBulkStream); // eslint-disable-line no-use-before-define
				}

				openedRooms[typeName].ready = false;
				openedRooms[typeName].active = false;
				if (openedRooms[typeName].template != null) {
					try {
						Blaze.remove(openedRooms[typeName].template);
					} catch (e) {
						console.error('Error removing template from DOM', e);
					}
				}
				delete openedRooms[typeName].dom;
				delete openedRooms[typeName].template;

				const { rid } = openedRooms[typeName];
				delete openedRooms[typeName];

				if (rid != null) {
					NewRoomManager.close(rid);
					return RoomHistoryManager.clear(rid);
				}
			}
		}

		closeOlderRooms() {
			if (Object.keys(openedRooms).length <= maxRoomsOpen) {
				return;
			}

			const roomsToClose = _.sortBy(_.values(openedRooms), 'lastSeen').reverse().slice(maxRoomsOpen);
			return Array.from(roomsToClose).map((roomToClose) => this.close(roomToClose.typeName));
		}

		closeAllRooms() {
			Object.keys(openedRooms).forEach((key) => {
				const openedRoom = openedRooms[key];
				this.close(openedRoom.typeName);
			});
			Session.set('openedRoom');
		}

		open({ typeName, rid }) {
			if (openedRooms[typeName] == null) {
				openedRooms[typeName] = {
					typeName,
					rid,
					active: false,
					ready: false,
					unreadSince: new ReactiveVar(undefined),
				};
			}

			openedRooms[typeName].lastSeen = new Date();

			if (openedRooms[typeName].ready) {
				this.closeOlderRooms();
			}

			if (CachedChatSubscription.ready.get() === true) {
				if (openedRooms[typeName].active !== true) {
					openedRooms[typeName].active = true;
					if (this.computation) {
						this.computation.invalidate();
					}
				}
			}

			return {
				ready() {
					Dep.depend();
					return openedRooms[typeName].ready;
				},
			};
		}

		existsDomOfRoom(typeName) {
			const room = openedRooms[typeName];
			return (room != null ? room.dom : undefined) != null;
		}

		updateUserStatus(user, status, utcOffset) {
			const onlineUsersValue = onlineUsers.curValue;

			if (status === 'offline') {
				delete onlineUsersValue[user.username];
			} else {
				onlineUsersValue[user.username] = {
					_id: user._id,
					status,
					utcOffset,
				};
			}

			return onlineUsers.set(onlineUsersValue);
		}

		updateMentionsMarksOfRoom(/* typeName */) {
			// const [ticksBar] = dom.getElementsByClassName('ticks-bar');
			// const [messagesBox] = dom.getElementsByClassName('messages-box');
			// const scrollTop = $('> .wrapper', messagesBox).scrollTop() - 50;
			// const totalHeight = $(' > .wrapper > ul', messagesBox).height() + 40;
			// if (!ticksBar) {
			// 	return;
			// }
			// // TODO: thread quotes should NOT have mention links at all
			// const mentionsSelector = '.message .body .mention-link--me, .message .body .mention-link--group';
			// ticksBar.innerHTML = Array.from(messagesBox?.querySelectorAll(mentionsSelector) || [])
			// 	.map((mentionLink) => {
			// 		const topOffset = $(mentionLink).offset().top + scrollTop;
			// 		const percent = (100 / totalHeight) * topOffset;
			// 		const className = [
			// 			'tick',
			// 			mentionLink.classList.contains('mention-link--me') && 'tick--me',
			// 			mentionLink.classList.contains('mention-link--group') && 'tick--group',
			// 		].filter(Boolean).join(' ');
			// 		return `<div class="${ className }" style="top: ${ percent }%;"></div>`;
			// 	})
			// 	.join('');
		}
	};
	Cls.initClass();
	return new Cls();
})();

const loadMissedMessages = async function (rid) {
	const lastMessage = ChatMessage.findOne({ rid, _hidden: { $ne: true }, temp: { $exists: false } }, { sort: { ts: -1 }, limit: 1 });

	if (lastMessage == null) {
		return;
	}

	try {
		const result = await callWithErrorHandling('loadMissedMessages', rid, lastMessage.ts);
		if (result) {
			const subscription = ChatSubscription.findOne({ rid });
			return Promise.all(Array.from(result).map((msg) => upsertMessage({ msg, subscription })));
		}
		return [];
	} catch (error) {
		return [];
	}
};

let connectionWasOnline = true;
Tracker.autorun(function () {
	const { connected } = Meteor.connection.status();

	if (connected === true && connectionWasOnline === false && RoomManager.openedRooms != null) {
		Object.keys(RoomManager.openedRooms).forEach((key) => {
			const value = RoomManager.openedRooms[key];
			if (value.rid != null) {
				loadMissedMessages(value.rid);
			}
		});
	}
	connectionWasOnline = connected;
});

Meteor.startup(() => {
	// Reload rooms after login
	let currentUsername = undefined;
	Tracker.autorun(() => {
		const user = Meteor.user();
		if (currentUsername === undefined && (user != null ? user.username : undefined) != null) {
			currentUsername = user.username;
			RoomManager.closeAllRooms();
			// Reload only if the current route is a channel route
			const roomType = roomCoordinator.getRouteNameIdentifier(FlowRouter.current().route.name);
			if (roomType) {
				FlowRouter.reload();
			}
		}
	});

	ChatMessage.find().observe({
		removed(record) {
			if (RoomManager.getOpenedRoomByRid(record.rid) != null) {
				const recordBefore = ChatMessage.findOne({ ts: { $lt: record.ts } }, { sort: { ts: -1 } });
				if (recordBefore != null) {
					ChatMessage.update({ _id: recordBefore._id }, { $set: { tick: new Date() } });
				}

				const recordAfter = ChatMessage.findOne({ ts: { $gt: record.ts } }, { sort: { ts: 1 } });
				if (recordAfter != null) {
					return ChatMessage.update({ _id: recordAfter._id }, { $set: { tick: new Date() } });
				}
			}
		},
	});
});

Tracker.autorun(function () {
	if (Meteor.userId()) {
		return Notifications.onUser('message', function (msg) {
			msg.u = msg.u || { username: 'rocket.cat' };
			msg.private = true;

			return ChatMessage.upsert({ _id: msg._id }, msg);
		});
	}
});

callbacks.add('afterLogoutCleanUp', () => RoomManager.closeAllRooms(), callbacks.priority.MEDIUM, 'roommanager-after-logout-cleanup');

CachedCollectionManager.onLogin(() => {
	Notifications.onUser('subscriptions-changed', (action, sub) => {
		const ignored = sub && sub.ignored ? { $nin: sub.ignored } : { $exists: true };

		ChatMessage.update({ rid: sub.rid, ignored }, { $unset: { ignored: true } }, { multi: true });
		if (sub && sub.ignored) {
			ChatMessage.update(
				{ 'rid': sub.rid, 't': { $ne: 'command' }, 'u._id': { $in: sub.ignored } },
				{ $set: { ignored: true } },
				{ multi: true },
			);
		}
	});
});
