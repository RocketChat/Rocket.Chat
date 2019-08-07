import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { lazyloadtick } from '../../lazy-load';
import { SideNav, menu } from '../../ui-utils';
import { settings } from '../../settings';
import { roomTypes, getUserPreference } from '../../utils';
import { Users } from '../../models';

Template.sideNav.helpers({
	flexTemplate() {
		return SideNav.getFlex().template;
	},

	flexData() {
		return SideNav.getFlex().data;
	},

	footer() {
		return String(settings.get('Layout_Sidenav_Footer')).trim();
	},

	roomType() {
		return roomTypes.getTypes().map((roomType) => ({
			template: roomType.customTemplate || 'roomList',
			data: {
				header: roomType.header,
				identifier: roomType.identifier,
				isCombined: roomType.isCombined,
				label: roomType.label,
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
		return getUserPreference(Meteor.userId(), 'sidebarHideAvatar');
	},
});

Template.sideNav.events({
	'click .close-flex'() {
		return SideNav.closeFlex();
	},

	'click .arrow'() {
		return SideNav.toggleCurrent();
	},

	'scroll .rooms-list'() {
		lazyloadtick();
		return menu.updateUnreadBars();
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
	const currentRouteState = FlowRouter.current();
	const needToBeRedirect = ['/', '/home'];
	const firstChannelAfterLogin = settings.get('First_Channel_After_Login');
	const room = roomTypes.findRoom('c', firstChannelAfterLogin, Meteor.userId());
	if (room && room._id && needToBeRedirect.includes(currentRouteState.path)) {
		FlowRouter.go(`/channel/${ firstChannelAfterLogin }`);
	}
};

Template.sideNav.onRendered(function() {
	SideNav.init();
	menu.init();
	lazyloadtick();
	redirectToDefaultChannelIfNeeded();

	return Meteor.defer(() => menu.updateUnreadBars());
});

Template.sideNav.onCreated(function() {
	this.groupedByType = new ReactiveVar(false);

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
