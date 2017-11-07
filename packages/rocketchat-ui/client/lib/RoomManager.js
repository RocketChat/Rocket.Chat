import _ from 'underscore';

const RoomManager = new function() {
	const openedRooms = {};
	const msgStream = new Meteor.Streamer('room-messages');
	const onlineUsers = new ReactiveVar({});
	const Dep = new Tracker.Dependency();
	const Cls = class {
		static initClass() {
			/* globals CachedChatRoom CachedChatSubscription */
			this.prototype.openedRooms = openedRooms;
			this.prototype.onlineUsers = onlineUsers;
			this.prototype.computation = Tracker.autorun(() => {
				Object.keys(openedRooms).forEach(typeName => {
					const record = openedRooms[typeName];
					if (record.active !== true || record.ready === true) { return; }
					const ready = CachedChatRoom.ready.get() && RocketChat.mainReady.get();
					if (ready !== true) { return; }
					const user = Meteor.user();

					const type = typeName.substr(0, 1);
					const name = typeName.substr(1);

					const room = Tracker.nonreactive(() => {
						return RocketChat.roomTypes.findRoom(type, name, user);
					});

					if (room == null) {
						record.ready = true;
					} else {
						openedRooms[typeName].rid = room._id;

						RoomHistoryManager.getMoreIfIsEmpty(room._id);
						record.ready = RoomHistoryManager.isLoading(room._id) === false;
						Dep.changed();

						if (openedRooms[typeName].streamActive !== true) {
							openedRooms[typeName].streamActive = true;
							msgStream.on(openedRooms[typeName].rid, msg =>

								RocketChat.promises.run('onClientMessageReceived', msg).then(function(msg) {

									// Should not send message to room if room has not loaded all the current messages
									if (RoomHistoryManager.hasMoreNext(openedRooms[typeName].rid) === false) {

										// Do not load command messages into channel
										if (msg.t !== 'command') {
											const roles = [
												(msg.u && msg.u._id && UserRoles.findOne(msg.u._id, { fields: { roles: 1 }})) || {},
												(msg.u && msg.u._id && RoomRoles.findOne({rid: msg.rid, 'u._id': msg.u._id})) || {}
											].map(e => e.roles);
											msg.roles = _.union.apply(_.union, roles);
											ChatMessage.upsert({ _id: msg._id }, msg);
											msg.room = {
												type,
												name
											};
										}
										msg.name = room.name;
										Meteor.defer(() => RoomManager.updateMentionsMarksOfRoom(typeName));

										RocketChat.callbacks.run('streamMessage', msg);

										return window.fireGlobalEvent('new-message', msg);
									}
								})
							);

							RocketChat.Notifications.onRoom(openedRooms[typeName].rid, 'deleteMessage', onDeleteMessageStream); // eslint-disable-line no-use-before-define
						}
					}
					return Dep.changed();
				});
			});
		}

		getOpenedRoomByRid(rid) {
			return Object.keys(openedRooms).map(typeName => openedRooms[typeName]).find(openedRoom => openedRoom.rid === rid);
		}

		getDomOfRoom(typeName, rid) {
			const room = openedRooms[typeName];
			if ((room == null)) {
				return;
			}

			if ((room.dom == null) && (rid != null)) {
				room.dom = document.createElement('div');
				room.dom.classList.add('room-container');
				const contentAsFunc = content => () => content;

				room.template = Blaze._TemplateWith({ _id: rid }, contentAsFunc(Template.room));
				Blaze.render(room.template, room.dom); //, nextNode, parentView
			}

			return room.dom;
		}

		close(typeName) {
			if (openedRooms[typeName]) {
				if (openedRooms[typeName].rid != null) {
					msgStream.removeAllListeners(openedRooms[typeName].rid);
					RocketChat.Notifications.unRoom(openedRooms[typeName].rid, 'deleteMessage', onDeleteMessageStream); // eslint-disable-line no-use-before-define
				}

				openedRooms[typeName].ready = false;
				openedRooms[typeName].active = false;
				if (openedRooms[typeName].template != null) {
					Blaze.remove(openedRooms[typeName].template);
				}
				delete openedRooms[typeName].dom;
				delete openedRooms[typeName].template;

				const { rid } = openedRooms[typeName];
				delete openedRooms[typeName];

				if (rid != null) {
					return RoomHistoryManager.clear(rid);
				}
			}
		}


		closeOlderRooms() {
			const maxRoomsOpen = 10;
			if (Object.keys(openedRooms).length <= maxRoomsOpen) {
				return;
			}

			const roomsToClose = _.sortBy(_.values(openedRooms), 'lastSeen').reverse().slice(maxRoomsOpen);
			return Array.from(roomsToClose).map((roomToClose) =>
				this.close(roomToClose.typeName));
		}


		closeAllRooms() {
			Object.keys(openedRooms).forEach(key => {
				const openedRoom = openedRooms[key];
				this.close(openedRoom.typeName);
			});
		}


		open(typeName) {
			if ((openedRooms[typeName] == null)) {
				openedRooms[typeName] = {
					typeName,
					active: false,
					ready: false,
					unreadSince: new ReactiveVar(undefined)
				};
			}

			openedRooms[typeName].lastSeen = new Date;

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
				}
			};
		}

		existsDomOfRoom(typeName) {
			const room = openedRooms[typeName];
			return ((room != null ? room.dom : undefined) != null);
		}

		updateUserStatus(user, status, utcOffset) {
			const onlineUsersValue = onlineUsers.curValue;

			if (status === 'offline') {
				delete onlineUsersValue[user.username];
			} else {
				onlineUsersValue[user.username] = {
					_id: user._id,
					status,
					utcOffset
				};
			}

			return onlineUsers.set(onlineUsersValue);
		}

		updateMentionsMarksOfRoom(typeName) {
			const dom = this.getDomOfRoom(typeName);
			if ((dom == null)) {
				return;
			}

			const ticksBar = $(dom).find('.ticks-bar');
			$(dom).find('.ticks-bar > .tick').remove();

			const scrollTop = $(dom).find('.messages-box > .wrapper').scrollTop() - 50;
			const totalHeight = $(dom).find('.messages-box > .wrapper > ul').height() + 40;

			return $('.messages-box .mention-link-me').each(function(index, item) {
				const topOffset = $(item).offset().top + scrollTop;
				const percent = (100 / totalHeight) * topOffset;
				if ($(item).hasClass('mention-link-all')) {
					return ticksBar.append(`<div class="tick background-attention-color" style="top: ${ percent }%;"></div>`);
				} else {
					return ticksBar.append(`<div class="tick background-primary-action-color" style="top: ${ percent }%;"></div>`);
				}
			});
		}
	};
	Cls.initClass();
	return new Cls;
};

const loadMissedMessages = function(rid) {
	const lastMessage = ChatMessage.findOne({rid}, {sort: {ts: -1}, limit: 1});
	if (lastMessage == null) {
		return;
	}

	return Meteor.call('loadMissedMessages', rid, lastMessage.ts, (err, result) =>
		Array.from(result).map((item) =>
			RocketChat.promises.run('onClientMessageReceived', item).then(function(item) {
				/* globals UserRoles RoomRoles*/
				const roles = [
					(item.u && item.u._id && UserRoles.findOne(item.u._id)) || {},
					(item.u && item.u._id && RoomRoles.findOne({rid: item.rid, 'u._id': item.u._id})) || {}
				].map(({roles}) => roles);
				item.roles = _.union.apply(_, roles);
				return ChatMessage.upsert({_id: item._id}, item);
			}))
	);
};

let connectionWasOnline = true;
Tracker.autorun(function() {
	const { connected } = Meteor.connection.status();

	if (connected === true && connectionWasOnline === false && RoomManager.openedRooms != null) {
		Object.keys(RoomManager.openedRooms).forEach(key => {
			const value = RoomManager.openedRooms[key];
			if (value.rid != null) {
				loadMissedMessages(value.rid);
			}
		});
	}
	return connectionWasOnline = connected;
});

Meteor.startup(() => {

	// Reload rooms after login
	let currentUsername = undefined;
	Tracker.autorun(() => {
		const user = Meteor.user();
		if ((currentUsername === undefined) && ((user != null ? user.username : undefined) != null)) {
			currentUsername = user.username;
			RoomManager.closeAllRooms();
			const roomTypes = RocketChat.roomTypes.roomTypes;
			// Reload only if the current route is a channel route
			const roomType = Object.keys(roomTypes).find(key => roomTypes[key].route && roomTypes[key].route.name === FlowRouter.current().route.name);
			if (roomType) {
				FlowRouter.reload();
			}
		}
	});

	ChatMessage.find().observe({
		removed(record) {
			if (RoomManager.getOpenedRoomByRid(record.rid) != null) {
				const recordBefore = ChatMessage.findOne({ts: {$lt: record.ts}}, {sort: {ts: -1}});
				if (recordBefore != null) {
					ChatMessage.update({_id: recordBefore._id}, {$set: {tick: new Date}});
				}

				const recordAfter = ChatMessage.findOne({ts: {$gt: record.ts}}, {sort: {ts: 1}});
				if (recordAfter != null) {
					return ChatMessage.update({_id: recordAfter._id}, {$set: {tick: new Date}});
				}
			}
		}
	});
});


const onDeleteMessageStream = msg => ChatMessage.remove({_id: msg._id});


Tracker.autorun(function() {
	if (Meteor.userId()) {
		return RocketChat.Notifications.onUser('message', function(msg) {
			msg.u =
			{username: 'rocket.cat'};
			msg.private = true;

			return ChatMessage.upsert({ _id: msg._id }, msg);
		});
	}
});

export { RoomManager };
this.RoomManager = RoomManager;
RocketChat.callbacks.add('afterLogoutCleanUp', () => RoomManager.closeAllRooms(), RocketChat.callbacks.priority.MEDIUM, 'roommanager-after-logout-cleanup');
