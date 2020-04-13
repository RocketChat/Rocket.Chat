import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';
import mem from 'mem';
import _ from 'underscore';

import { ChatSubscription, Rooms } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { roomTypes } from '../../../utils';
import { call, callMethod } from './callMethod';

import { RoomManager, fireGlobalEvent, RoomHistoryManager } from '..';

window.currentTracker = undefined;

const getDomOfLoading = mem(function getDomOfLoading() {
	const loadingDom = document.createElement('div');
	const contentAsFunc = (content) => () => content;

	const template = Blaze._TemplateWith({ }, contentAsFunc(Template.loading));
	Blaze.render(template, loadingDom);

	return loadingDom;
});

function replaceCenterDomBy(dom) {
	document.dispatchEvent(new CustomEvent('main-content-destroyed'));

	const mainNode = document.querySelector('.main-content');
	if (mainNode) {
		for (const child of Array.from(mainNode.children)) {
			if (child) { mainNode.removeChild(child); }
		}
		mainNode.appendChild(dom);
	}

	return mainNode;
}

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
			BlazeLayout.render('main');
			return;
		}

		try {
			const room = roomTypes.findRoom(type, name, user) || await callMethod('getRoomByTypeAndName', type, name);
			Rooms.upsert({ _id: room._id }, _.omit(room, '_id'));

			if (RoomManager.open(type + name).ready() !== true) {
				if (settings.get('Accounts_AllowAnonymousRead')) {
					BlazeLayout.render('main');
				}
				replaceCenterDomBy(getDomOfLoading());
				return;
			}

			c.stop();

			if (window.currentTracker) {
				window.currentTracker = undefined;
			}

			if (room._id !== name && type === 'd') { // Redirect old url using username to rid
				RoomManager.close(type + name);
				return FlowRouter.go('direct', { rid: room._id }, FlowRouter.current().queryParams);
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
			// KonchatNotification.removeRoomNotification(params._id)
			// update user's room subscription
			const sub = ChatSubscription.findOne({ rid: room._id });
			if (sub && sub.open === false) {
				call('openRoom', room._id);
			}

			if (FlowRouter.getQueryParam('msg')) {
				const msg = { _id: FlowRouter.getQueryParam('msg'), rid: room._id };
				RoomHistoryManager.getSurroundingMessages(msg);
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
			return BlazeLayout.render('main', { center: 'roomNotFound' });
		}
	});
};
