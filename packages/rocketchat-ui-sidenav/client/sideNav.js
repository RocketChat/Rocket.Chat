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
		return RocketChat.roomTypes.getTypes();
	},

	canShowRoomType() {
		if (Template.instance().mergedChannels.get()) {
			return RocketChat.roomTypes.checkCondition(this) && (this.identifier !== 'p');
		}

		return RocketChat.roomTypes.checkCondition(this);
	},

	isCombined() {
		if (Template.instance().mergedChannels.get()) {
			return this.identifier === 'c';
		}

		return false;
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

	'dropped .side-nav'(e) {
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
			userPref = user.settings.preferences.mergeChannels;
		}

		this.mergedChannels.set((userPref != null) ? userPref : RocketChat.settings.get('UI_Merge_Channels_Groups'));
	});
});
