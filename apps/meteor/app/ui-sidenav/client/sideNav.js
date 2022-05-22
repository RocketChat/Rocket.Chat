import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { SideNav, menu } from '../../ui-utils';
import { settings } from '../../settings';
import { getUserPreference } from '../../utils';
import { Users } from '../../models';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';

Template.sideNav.helpers({
	dataQa() {
		return Template.instance().menuState.get() === 'opened';
	},

	flexTemplate() {
		return SideNav.getFlex().template;
	},

	flexData() {
		return SideNav.getFlex().data;
	},

	roomType() {
		return roomCoordinator.getSortedTypes().map(({ config }) => ({
			template: config.customTemplate || 'roomList',
			data: {
				header: config.header,
				identifier: config.identifier,
				label: config.label,
			},
		}));
	},

	loggedInUser() {
		return !!Meteor.userId();
	},

	sidebarViewMode() {
		const viewMode = getUserPreference(Meteor.userId(), 'sidebarViewMode');
		return viewMode || 'condensed';
	},

	sidebarHideAvatar() {
		return !getUserPreference(Meteor.userId(), 'sidebarDisplayAvatar');
	},
});

Template.sideNav.events({
	'click .close-flex'() {
		return SideNav.closeFlex();
	},

	'dropped .sidebar'(e) {
		return e.preventDefault();
	},
	'mouseenter .sidebar-item__link'(e) {
		const element = e.currentTarget;
		setTimeout(() => {
			const ellipsedElement = element.querySelector('.sidebar-item__ellipsis');
			const isTextEllipsed = ellipsedElement.offsetWidth < ellipsedElement.scrollWidth;

			if (isTextEllipsed) {
				element.setAttribute('title', element.getAttribute('aria-label'));
			} else {
				element.removeAttribute('title');
			}
		}, 0);
	},
});

const redirectToDefaultChannelIfNeeded = () => {
	const needToBeRedirect = () => ['/', '/home'].includes(FlowRouter.current().path);

	Tracker.autorun((c) => {
		const firstChannelAfterLogin = settings.get('First_Channel_After_Login');

		if (!needToBeRedirect()) {
			return c.stop();
		}

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
};

Template.sideNav.onRendered(function () {
	SideNav.init();
	menu.init();

	this.stopMenuListener = menu.on('change', () => {
		this.menuState.set(menu.isOpen() ? 'opened' : 'closed');
	});
	redirectToDefaultChannelIfNeeded();
});

Template.sideNav.onDestroyed(function () {
	this.stopMenuListener();
});
Template.sideNav.onCreated(function () {
	this.groupedByType = new ReactiveVar(false);

	this.menuState = new ReactiveVar(menu.isOpen() ? 'opened' : 'closed');

	this.autorun(() => {
		const user = Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.sidebarGroupByType': 1,
			},
		});
		const userPref = getUserPreference(user, 'sidebarGroupByType');
		this.groupedByType.set(userPref || settings.get('UI_Group_Channels_By_Type'));
	});
});
