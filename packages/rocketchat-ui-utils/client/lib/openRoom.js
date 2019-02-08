import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';
import { RoomManager, fireGlobalEvent, readMessage, RoomHistoryManager, Layout } from '..';
import { ChatSubscription, Rooms } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { roomTypes, handleError } from 'meteor/rocketchat:utils';
import _ from 'underscore';

window.currentTracker = undefined;

export const openRoom = function(type, name) {
	Session.set('openedRoom', null);

	return Meteor.defer(() =>
		window.currentTracker = Tracker.autorun(function(c) {
			const user = Meteor.user();
			if ((user && user.username == null) || (user == null && settings.get('Accounts_AllowAnonymousRead') === false)) {
				BlazeLayout.render('main');
				return;
			}

			if (RoomManager.open(type + name).ready() !== true) {
				BlazeLayout.render('main', { modal: Layout.isEmbedded(), center: 'loading' });
				return;
			}
			if (window.currentTracker) {
				window.currentTracker = undefined;
			}
			c.stop();

			const room = roomTypes.findRoom(type, name, user);
			if (room == null) {
				if (type === 'd') {
					Meteor.call('createDirectMessage', name, function(error) {
						if (!error) {
							RoomManager.close(type + name);
							return openRoom('d', name);
						} else {
							Session.set('roomNotFound', { type, name, error });
							BlazeLayout.render('main', { center: 'roomNotFound' });
							return;
						}
					});
				} else {
					Meteor.call('getRoomByTypeAndName', type, name, function(error, record) {
						if (error) {
							Session.set('roomNotFound', { type, name, error });
							return BlazeLayout.render('main', { center: 'roomNotFound' });
						} else {
							Rooms.upsert({ _id: record._id }, _.omit(record, '_id'));
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
			RoomManager.openedRoom = room._id;

			fireGlobalEvent('room-opened', _.omit(room, 'usernames'));

			Session.set('editRoomTitle', false);
			RoomManager.updateMentionsMarksOfRoom(type + name);
			Meteor.setTimeout(() => readMessage.readNow(), 2000);
			// KonchatNotification.removeRoomNotification(params._id)
			// update user's room subscription
			const sub = ChatSubscription.findOne({ rid: room._id });
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

			return callbacks.run('enter-room', sub);
		})
	);
};
