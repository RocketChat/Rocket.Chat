import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { lazyloadtick } from '../../lazy-load';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
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
		const user = Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.sidebarSortby': 1,
				'settings.preferences.sidebarShowFavorites': 1,
				'settings.preferences.sidebarShowUnread': 1,
				'settings.preferences.sidebarShowDiscussion': 1,
				'services.tokenpass': 1,
				'settings.preferences.roomCounterSidebar': 1,
				'settings.preferences.messageViewMode': 1,
				'settings.preferences.sidebarViewMode': 1,
				username: 1,
			},
		});
		const s = {
			Favorite_Rooms: settings.get('Favorite_Rooms'),
			UI_Use_Real_Name: settings.get('UI_Use_Real_Name'),
			Store_Last_Message: settings.get('Store_Last_Message'),
			sidebarViewMode: getUserPreference(user, 'sidebarViewMode'),
			messageViewMode: getUserPreference(user, 'messageViewMode'),
			roomCounterSidebar: getUserPreference(user, 'roomCounterSidebar'),
			sidebarShowFavorites: getUserPreference(user, 'sidebarShowFavorites'),
			sidebarShowDiscussion: getUserPreference(user, 'sidebarShowDiscussion'),
			sidebarShowUnread: getUserPreference(user, 'sidebarShowUnread'),
		};
		return roomTypes.getTypes().map((roomType) => ({
			template: roomType.customTemplate || 'roomList',
			data: {
				header: roomType.header,
				identifier: roomType.identifier,
				isCombined: roomType.isCombined,
				label: roomType.label,
				user,
				settings: s,
			},
		}));
	},

	loggedInUser() {
		return !!Meteor.userId();
	},

	sidebarViewMode() {
		const viewMode = getUserPreference(Meteor.userId(), 'sidebarViewMode');
		return viewMode ? viewMode : 'condensed';
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

Template.sideNav.onRendered(function() {
	SideNav.init();
	menu.init();
	lazyloadtick();
	const first_channel_login = settings.get('First_Channel_After_Login');
	const room = roomTypes.findRoom('c', first_channel_login, Meteor.userId());
	if (room !== undefined && room._id !== '') {
		FlowRouter.go(`/channel/${ first_channel_login }`);
	}

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
		this.groupedByType.set(userPref ? userPref : settings.get('UI_Group_Channels_By_Type'));
	});
});
