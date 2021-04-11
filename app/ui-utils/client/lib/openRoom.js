import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { memoize } from '@rocket.chat/memo';
import _ from 'underscore';
import { HTML } from 'meteor/htmljs';

import * as AppLayout from '../../../../client/lib/appLayout';
import { Messages, ChatSubscription, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { roomTypes } from '../../../utils';
import { call, callMethod } from './callMethod';
import { RoomManager, fireGlobalEvent, RoomHistoryManager } from '..';
import { waitUntilWrapperExists } from './RoomHistoryManager';

window.currentTracker = undefined;

// cleanup session when hot reloading
Session.set('openedRoom', null);

const getDomOfLoading = memoize(() => {
	const loadingDom = document.createElement('div');
	Blaze.render(Template.loading, loadingDom);
	return loadingDom;
});

const createTemplateForDomNode = memoize((node) => {
	const templateName = Math.random().toString(16).slice(2);

	// eslint-disable-next-line new-cap
	const template = new Blaze.Template(templateName, () => HTML.Comment(''));

	template.onRendered(function() {
		this.firstNode.parentNode.insertBefore(node, this.firstNode);
	});

	template.onDestroyed(function() {
		delete Template[templateName];
	});

	Template[templateName] = template;

	return templateName;
});

const replaceCenterDomBy = (dom) => {
	const roomNode = dom();
	AppLayout.render('main', { center: createTemplateForDomNode(roomNode) });

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
			AppLayout.render('main');
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
					AppLayout.render('main');
				}

				replaceCenterDomBy(() => getDomOfLoading());
				return;
			}

			AppLayout.render('main', { center: 'loading' });

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
			return AppLayout.render('main', { center: 'roomNotFound' });
		}
	});
};
