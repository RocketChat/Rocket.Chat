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
		const types = RocketChat.roomTypes.getTypes();
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		const mode = preferences.roomsListExhibitionMode || 'activity';
		const filter = {
			activity(room) {
				return ['f', 'activity'].includes(room.identifier);
			},
			unread(room) {
				return ['f', ...(preferences.mergeChannels ? ['channels'] : ['p', 'c']), 'd', 'unread'].includes(room.identifier);
			},
			category(room) {
				return ['f', ...(preferences.mergeChannels ? ['channels'] : ['p', 'c']), 'd'].includes(room.identifier);
			}
		}[mode];

		return types.filter(filter);
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
