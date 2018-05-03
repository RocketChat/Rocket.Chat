/* globals fireGlobalEvent readMessage currentTracker*/
import _ from 'underscore';

currentTracker = undefined;

function openRoom(type, name) {
	Session.set('openedRoom', null);

	return Meteor.defer(() =>
		currentTracker = Tracker.autorun(function(c) {
			const user = Meteor.user();
			if ((user && user.username == null) || user == null && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
				BlazeLayout.render('main');
				return;
			}

			if (RoomManager.open(type + name).ready() !== true) {
				BlazeLayout.render('main', { modal: RocketChat.Layout.isEmbedded(), center: 'loading' });
				return;
			}
			if (currentTracker) {
				currentTracker = undefined;
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
							Session.set('roomNotFound', {type, name});
							BlazeLayout.render('main', {center: 'roomNotFound'});
							return;
						}
					});
				} else {
					Meteor.call('getRoomByTypeAndName', type, name, function(err, record) {
						if (err) {
							Session.set('roomNotFound', {type, name});
							return BlazeLayout.render('main', {center: 'roomNotFound'});
						} else {
							delete record.$loki;
							RocketChat.models.Rooms.upsert({ _id: record._id }, _.omit(record, '_id'));
							RoomManager.close(type + name);
							return openRoom(type, name);
						}
					});
				}
				return;
			}

			const mainNode = document.querySelector('.main-content');
			if (mainNode) {
				for (const child of Array.from(mainNode.children)) {
					if (child) { mainNode.removeChild(child); }
				}
				const roomDom = RoomManager.getDomOfRoom(type + name, room._id);
				mainNode.appendChild(roomDom);
				if (roomDom.classList.contains('room-container')) {
					roomDom.querySelector('.messages-box > .wrapper').scrollTop = roomDom.oldScrollTop;
				}
			}

			Session.set('openedRoom', room._id);
			RocketChat.openedRoom = room._id;

			fireGlobalEvent('room-opened', _.omit(room, 'usernames'));

			Session.set('editRoomTitle', false);
			RoomManager.updateMentionsMarksOfRoom(type + name);
			Meteor.setTimeout(() => readMessage.readNow(), 2000);
			// KonchatNotification.removeRoomNotification(params._id)
			// update user's room subscription
			const sub = ChatSubscription.findOne({rid: room._id});
			if (sub && sub.open === false) {
				Meteor.call('openRoom', room._id, function(err) {
					if (err) {
						return handleError(err);
					}
				});
			}

			if (FlowRouter.getQueryParam('msg')) {
				const msg = { _id: FlowRouter.getQueryParam('msg'), rid: room._id };
				RoomHistoryManager.getSurroundingMessages(msg);
			}

			return RocketChat.callbacks.run('enter-room', sub);
		})
	);
}
export { openRoom };
this.openRoom = openRoom;
