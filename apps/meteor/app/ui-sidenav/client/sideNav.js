import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SideNav, menu } from '../../ui-utils';
import { settings } from '../../settings';
import { getUserPreference } from '../../utils';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';

Template.sideNav.helpers({
	flexTemplate() {
		return SideNav.getFlex().template;
	},

	flexData() {
		return SideNav.getFlex().data;
	},

	sidebarViewMode() {
		const viewMode = getUserPreference(Meteor.userId(), 'sidebarViewMode');
		return viewMode || 'condensed';
	},

	sidebarHideAvatar() {
		return !getUserPreference(Meteor.userId(), 'sidebarDisplayAvatar');
	},
});

Template.sideNav.onRendered(function () {
	SideNav.init();
	menu.init();

	this.stopMenuListener = menu.on('change', () => {
		this.menuState.set(menu.isOpen() ? 'opened' : 'closed');
	});

	const needToBeRedirect = () => ['/', '/home'].includes(FlowRouter.current().path);

	this.autorun((c) => {
		if (!needToBeRedirect()) {
			return c.stop();
		}

		const firstChannelAfterLogin = settings.get('First_Channel_After_Login');
		if (!firstChannelAfterLogin) {
			return c.stop();
		}

		const room = roomCoordinator.getRoomDirectives('c')?.findRoom(firstChannelAfterLogin);
		if (!room) {
			return;
		}

		c.stop();
		FlowRouter.go(`/channel/${firstChannelAfterLogin}`);
	});
});

Template.sideNav.onDestroyed(function () {
	this.stopMenuListener();
});

Template.sideNav.onCreated(function () {
	this.menuState = new ReactiveVar(menu.isOpen() ? 'opened' : 'closed');
});
