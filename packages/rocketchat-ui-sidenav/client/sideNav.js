/* globals menu*/

Template.sideNav.helpers({
	hasUnread() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.roomsListExhibitionMode === 'unread';
	},
	sortByActivity() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.roomsListExhibitionMode === 'activity';
	},
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
		return RocketChat.roomTypes.getTypes();
	}
});

Template.sideNav.events({
	'click .close-flex'() {
		return SideNav.closeFlex();
	},

	'click .arrow'() {
		return SideNav.toggleCurrent();
	},

	'mouseenter .header'() {
		return SideNav.overArrow();
	},

	'mouseleave .header'() {
		return SideNav.leaveArrow();
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
		const user = Meteor.user();
		let userPref = null;
		if (user && user.settings && user.settings.preferences) {
			userPref = user.settings.preferences.roomsListExhibitionMode === 'category' && user.settings.preferences.mergeChannels;
		}

		this.mergedChannels.set((userPref != null) ? userPref : RocketChat.settings.get('UI_Merge_Channels_Groups'));
	});
});
