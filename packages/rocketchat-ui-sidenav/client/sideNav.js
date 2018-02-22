/* globals menu*/

Template.sideNav.helpers({
	flexTemplate() {
		return SideNav.getFlex().template;
	},

	flexData() {
		return SideNav.getFlex().data;
	},

	footer() {
		return RocketChat.settings.get('Layout_Sidenav_Footer');
	},

	roomType() {
		return RocketChat.roomTypes.getTypes().map((roomType) => {
			return {
				template: roomType.customTemplate || 'roomList',
				data: {
					header: roomType.header,
					identifier: roomType.identifier,
					isCombined: roomType.isCombined,
					label: roomType.label
				}
			};
		});
	},

	loggedInUser() {
		return !!Meteor.userId();
	},

	sidebarViewMode() {
		const viewMode = RocketChat.getUserPreference(Meteor.userId(), 'sidebarViewMode');
		return viewMode ? viewMode : 'condensed';
	},

	sidebarHideAvatar() {
		return RocketChat.getUserPreference(Meteor.user(), 'sidebarHideAvatar');
	}
});

Template.sideNav.events({
	'click .close-flex'() {
		return SideNav.closeFlex();
	},

	'click .arrow'() {
		return SideNav.toggleCurrent();
	},

	'scroll .rooms-list'() {
		return menu.updateUnreadBars();
	},

	'dropped .sidebar'(e) {
		return e.preventDefault();
	}
});

Template.sideNav.onRendered(function() {
	SideNav.init();
	menu.init();
	// GAZZO router line 27;
	const first_channel_login = RocketChat.settings.get('First_Channel_After_Login');
	const room = RocketChat.roomTypes.findRoom('c', first_channel_login, Meteor.userId());
	if (room !== undefined && room._id !== '') {
		FlowRouter.go(`/channel/${ first_channel_login }`);
	}

	return Meteor.defer(() => menu.updateUnreadBars());
});

Template.sideNav.onCreated(function() {
	this.mergedChannels = new ReactiveVar(false);

	this.autorun(() => {
		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.roomsListExhibitionMode': 1,
				'settings.preferences.mergeChannels': 1
			}
		});
		const userPref = RocketChat.getUserPreference(user, 'roomsListExhibitionMode') === 'category' && RocketChat.getUserPreference(user, 'mergeChannels');
		this.mergedChannels.set(userPref ? userPref : RocketChat.settings.get('UI_Merge_Channels_Groups'));
	});
});
