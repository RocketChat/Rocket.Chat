import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import _ from 'underscore';

import { appLayout } from '../../../../client/lib/appLayout';
import { Messages, ChatSubscription } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { roomTypes } from '../../../utils';
import { call, callMethod } from './callMethod';
import { RoomManager, fireGlobalEvent, RoomHistoryManager } from '..';
import { RoomManager as NewRoomManager } from '../../../../client/lib/RoomManager';
import { Rooms } from '../../../models/client';

window.currentTracker = undefined;

// cleanup session when hot reloading
Session.set('openedRoom', null);


export const waitUntilRoomBeInserted = async (type, rid) => new Promise((resolve) => {
	Tracker.autorun((c) => {
		const room = roomTypes.findRoom(type, rid, Meteor.user());
		if (room) {
			c.stop();
			return resolve(room);
		}
	});
});


NewRoomManager.on('changed', (rid) => {
	Session.set('openedRoom', rid);
	RoomManager.openedRoom = rid;
});

export const openRoom = async function(type, name, render = true) {
	window.currentTracker && window.currentTracker.stop();
	window.currentTracker = Tracker.autorun(async function(c) {
		const user = Meteor.user();
		if ((user && user.username == null) || (user == null && settings.get('Accounts_AllowAnonymousRead') === false)) {
			appLayout.render('main');
			return;
		}

		try {
			const room = roomTypes.findRoom(type, name, user) || await callMethod('getRoomByTypeAndName', type, name);
			Rooms.upsert({ _id: room._id }, _.omit(room, '_id'));

			if (room._id !== name && type === 'd') { // Redirect old url using username to rid
				RoomManager.close(type + name);
				return FlowRouter.go('direct', { rid: room._id }, FlowRouter.current().queryParams);
			}


			if (room._id === Session.get('openedRoom') && !FlowRouter.getQueryParam('msg')) {
				return;
			}

			RoomManager.open(type + name);

			render && appLayout.render('main', { center: 'room' });


			c.stop();

			if (window.currentTracker) {
				window.currentTracker = undefined;
			}

			NewRoomManager.open(room._id);

			fireGlobalEvent('room-opened', _.omit(room, 'usernames'));

			Session.set('editRoomTitle', false);
			// KonchatNotification.removeRoomNotification(params._id)
			// update user's room subscription
			const sub = ChatSubscription.findOne({ rid: room._id });
			if (sub && sub.open === false) {
				call('openRoom', room._id);
			}

			if (FlowRouter.getQueryParam('msg')) {
				const messageId = FlowRouter.getQueryParam('msg');
				const msg = { _id: messageId, rid: room._id };

				const message = Messages.findOne({ _id: msg._id }) || (await call('getMessages', [msg._id]))[0];

				if (message && (message.tmid || message.tcount)) {
					return FlowRouter.setParams({ tab: 'thread', context: message.tmid || message._id });
				}

				RoomHistoryManager.getSurroundingMessages(msg);
				FlowRouter.setQueryParams({
					msg: undefined,
				});
			}

			return callbacks.run('enter-room', sub);
		} catch (error) {
			c.stop();
			if (type === 'd') {
				const result = await call('createDirectMessage', ...name.split(', '));
				if (result) {
					return FlowRouter.go('direct', { rid: result._id }, FlowRouter.current().queryParams);
				}
			}
			Session.set('roomNotFound', { type, name, error });
			return appLayout.render('main', { center: 'roomNotFound' });
		}
	});
};
