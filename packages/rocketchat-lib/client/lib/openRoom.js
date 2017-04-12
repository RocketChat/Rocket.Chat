/* globals fireGlobalEvent readMessage*/
const openRoom = function(type, name) {
	Session.set('openedRoom', null);
	Meteor.defer(function() {
		Tracker.autorun(function(c) {
			if (RoomManager.open(type + name).ready() !== true) {
				return BlazeLayout.render('main', {
					modal: RocketChat.Layout.isEmbedded(),
					center: 'loading'
				});
			}
			const user = Meteor.user();
			if (!(user != null && user.username)) {
				return;
			}
			c.stop();
			const room = RocketChat.roomTypes.findRoom(type, name, user);
			if (room == null) {
				if (type === 'd') {
					Meteor.call('createDirectMessage', name, function(err) {
						if (!err) {
							RoomManager.close(type + name);
							return openRoom('d', name);
						} else {
							Session.set('roomNotFound', {
								type,
								name
							});
							BlazeLayout.render('main', {
								center: 'roomNotFound'
							});
						}
					});
				} else {
					Meteor.call('getRoomByTypeAndName', type, name, function(err, record) {
						if (err != null) {
							Session.set('roomNotFound', {
								type,
								name
							});
							return BlazeLayout.render('main', {
								center: 'roomNotFound'
							});
						} else {
							delete record.$loki;
							RocketChat.models.Rooms.upsert({
								_id: record._id
							}, _.omit(record, '_id'));
							RoomManager.close(type + name);
							return openRoom(type, name);
						}
					});
				}
				return;
			}
			const mainNode = document.querySelector('.main-content');
			if (mainNode != null) {
				[...((mainNode && mainNode.children) || [])].forEach(child => {
					mainNode.removeChild(child);
				});
				const roomDom = RoomManager.getDomOfRoom(type + name, room._id);
				mainNode.appendChild(roomDom);
				if (roomDom.classList.contains('room-container')) {
					roomDom.querySelector('.messages-box > .wrapper').scrollTop = roomDom.oldScrollTop;
				}
			}
			Session.set('openedRoom', room._id);
			fireGlobalEvent('room-opened', _.omit(room, 'usernames'));
			Session.set('editRoomTitle', false);
			RoomManager.updateMentionsMarksOfRoom(type + name);

			Meteor.setTimeout(() => {
				readMessage.readNow();
			}, 2000);

			if (Meteor.Device.isDesktop() && window.chatMessages && window.chatMessages[room._id] != null) {
				setTimeout(() => {
					return $('.message-form .input-message').focus();
				}, 100);
			}
			const sub = ChatSubscription.findOne({
				rid: room._id
			});
			if (sub && sub.open === false) {
				Meteor.call('openRoom', room._id, function(err) {
					if (err) {
						return handleError(err);
					}
				});
			}
			if (FlowRouter.getQueryParam('msg')) {
				const msg = {
					_id: FlowRouter.getQueryParam('msg'),
					rid: room._id
				};
				RoomHistoryManager.getSurroundingMessages(msg);
			}
			return RocketChat.callbacks.run('enter-room', sub);
		});
	});
};
this.openRoom = openRoom;
