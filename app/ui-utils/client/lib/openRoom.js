import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import _ from 'underscore';
import { Random } from 'meteor/random';

import { appLayout } from '../../../../client/lib/appLayout';
import { Messages, ChatSubscription, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { roomTypes } from '../../../utils';
import { call, callMethod } from './callMethod';
import { RoomManager, fireGlobalEvent, RoomHistoryManager } from '..';
import { waitUntilWrapperExists } from './RoomHistoryManager';
import { createTemplateForComponent } from '../../../../client/lib/portals/createTemplateForComponent';

window.currentTracker = undefined;

// cleanup session when hot reloading
Session.set('openedRoom', null);

const replaceCenterDomBy = (dom) => {
	const roomNode = dom();

	const center = createTemplateForComponent(Random.id(), () => import('../../../../client/views/root/DomNode'), {
		attachment: 'at-parent',
		props: () => ({ node: roomNode }),
	});

	appLayout.render('main', { center });

	return roomNode;
};

const waitUntilRoomBeInserted = async (type, rid) => new Promise((resolve) => {
	Tracker.autorun((c) => {
		const room = roomTypes.findRoom(type, rid, Meteor.user());
		if (room) {
			c.stop();
			return resolve(room);
		}
	});
});

export const openRoom = async function(type, name) {
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

			if (RoomManager.open(type + name).ready() !== true) {
				if (settings.get('Accounts_AllowAnonymousRead')) {
					appLayout.render('main');
				}

				appLayout.render('main', { center: 'loading' });
				return;
			}

			appLayout.render('main', { center: 'loading' });

			c.stop();

			if (window.currentTracker) {
				window.currentTracker = undefined;
			}

			const roomDom = replaceCenterDomBy(() => RoomManager.getDomOfRoom(type + name, room._id, roomTypes.getConfig(type).mainTemplate));

			const selector = await waitUntilWrapperExists('.messages-box .wrapper');
			selector.scrollTop = roomDom.oldScrollTop;

			Session.set('openedRoom', room._id);
			RoomManager.openedRoom = room._id;

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
				const result = await call('createDirectMessage', ...name.split(', ')).then((result) => waitUntilRoomBeInserted(type, result.rid)).catch(() => {});
				if (result) {
					return FlowRouter.go('direct', { rid: result._id }, FlowRouter.current().queryParams);
				}
			}
			Session.set('roomNotFound', { type, name, error });
			return appLayout.render('main', { center: 'roomNotFound' });
		}
	});
};
