import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { lazyloadtick } from 'meteor/rocketchat:lazy-load';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { SideNav, menu } from 'meteor/rocketchat:ui-utils';
import { settings } from 'meteor/rocketchat:settings';
import { roomTypes, getUserPreference } from 'meteor/rocketchat:utils';
import { Users } from 'meteor/rocketchat:models';

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

	threadingFromSidebar() {
		return RocketChat.getUserPreference(Meteor.userId(), 'sidebarShowThreads') && !Meteor.isCordova;
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

	'click .js-create-thread'() {
		return FlowRouter.go('create-thread');
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
