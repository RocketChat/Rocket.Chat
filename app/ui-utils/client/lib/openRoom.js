import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';
import { RoomManager, fireGlobalEvent, readMessage, RoomHistoryManager } from '..';
import { ChatSubscription, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { roomTypes, handleError } from '../../../utils';
import _ from 'underscore';

window.currentTracker = undefined;

let loadingDom;
function getDomOfLoading() {
	if (loadingDom) {
		return loadingDom;
	}

	loadingDom = document.createElement('div');
	const contentAsFunc = (content) => () => content;

	const template = Blaze._TemplateWith({ }, contentAsFunc(Template.loading));
	Blaze.render(template, loadingDom);

	return loadingDom;
}

function replaceCenterDomBy(dom) {
	const mainNode = document.querySelector('.main-content');
	if (mainNode) {
		for (const child of Array.from(mainNode.children)) {
			if (child) { mainNode.removeChild(child); }
		}
		mainNode.appendChild(dom);
	}

	return mainNode;
}

export const openRoom = function(type, name) {
	Session.set('openedRoom', null);

	return Meteor.defer(() => {
		window.currentTracker = Tracker.autorun(function(c) {
			const user = Meteor.user();
			if ((user && user.username == null) || (user == null && settings.get('Accounts_AllowAnonymousRead') === false)) {
				BlazeLayout.render('main');
				return;
			}

			if (RoomManager.open(type + name).ready() !== true) {
				replaceCenterDomBy(getDomOfLoading());
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
						}
						Session.set('roomNotFound', { type, name, error });
						BlazeLayout.render('main', { center: 'roomNotFound' });
						return;
					});
				} else {
					Meteor.call('getRoomByTypeAndName', type, name, function(error, record) {
						if (error) {
							Session.set('roomNotFound', { type, name, error });
							return BlazeLayout.render('main', { center: 'roomNotFound' });
						}
						Rooms.upsert({ _id: record._id }, _.omit(record, '_id'));
						RoomManager.close(type + name);
						return openRoom(type, name);
					});
				}
				return;
			}

			const roomDom = RoomManager.getDomOfRoom(type + name, room._id);
			const mainNode = replaceCenterDomBy(roomDom);

			if (mainNode) {
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
		});
	});
};
