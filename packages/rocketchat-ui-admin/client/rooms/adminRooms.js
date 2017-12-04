/*globals AdminChatRoom, RocketChat */
import _ from 'underscore';
import s from 'underscore.string';

import { RocketChatTabBar } from 'meteor/rocketchat:lib';

this.AdminChatRoom = new Mongo.Collection('rocketchat_room');

Template.adminRooms.helpers({
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	rooms() {
		return Template.instance().rooms();
	},
	isLoading() {
		const instance = Template.instance();
		if (!(instance.ready && instance.ready.get())) {
			return 'btn-loading';
		}
	},
	hasMore() {
		const instance = Template.instance();
		if (instance.limit && instance.limit.get() && instance.rooms() && instance.rooms().count()) {
			return instance.limit.get() === instance.rooms().count();
		}
	},
	roomCount() {
		const rooms = Template.instance().rooms();
		return rooms && rooms.count();
	},
	name() {
		return RocketChat.roomTypes.roomTypes[this.t].getDisplayName(this);
	},
	type() {
		return TAPi18n.__(RocketChat.roomTypes.roomTypes[this.t].label);
	},
	'default'() {
		if (this['default']) {
			return t('True');
		} else {
			return t('False');
		}
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar
		};
	}
});

Template.adminRooms.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.types = new ReactiveVar([]);
	this.ready = new ReactiveVar(true);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	RocketChat.TabBar.addButton({
		groups: ['admin-rooms'],
		id: 'admin-room',
		i18nTitle: 'Room_Info',
		icon: 'info-circled',
		template: 'adminRoomInfo',
		order: 1
	});
	RocketChat.ChannelSettings.addOption({
		group: ['admin-room'],
		id: 'make-default',
		template: 'channelSettingsDefault',
		data() {
			return Session.get('adminRoomsSelected');
		},
		validation() {
			return RocketChat.authz.hasAllPermission('view-room-administration');
		}
	});
	this.autorun(function() {
		const filter = instance.filter.get();
		let types = instance.types.get();
		if (types.length === 0) {
			types = ['c', 'd', 'p'];
		}
		const limit = instance.limit.get();
		const subscription = instance.subscribe('adminRooms', filter, types, limit);
		instance.ready.set(subscription.ready());
	});
	this.rooms = function() {
		let filter;
		if (instance.filter && instance.filter.get()) {
			filter = s.trim(instance.filter.get());
		}
		let types = instance.types && instance.types.get();
		if (!_.isArray(types)) {
			types = [];
		}
		let query = {};
		filter = s.trim(filter);
		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { $or: [{ name: filterReg }, { t: 'd', usernames: filterReg } ]};
		}
		if (types.length) {
			query['t'] = { $in: types };
		}
		const limit = instance.limit && instance.limit.get();
		return AdminChatRoom.find(query, { limit, sort: { 'default': -1, name: 1}});
	};
	this.getSearchTypes = function() {
		return _.map($('[name=room-type]:checked'), function(input) {
			return $(input).val();
		});
	};
});

Template.adminRooms.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.adminRooms.events({
	'keydown #rooms-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #rooms-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},
	'click .room-info'(e, instance) {
		e.preventDefault();
		Session.set('adminRoomsSelected', {
			rid: this._id
		});
		instance.tabBar.open('admin-room');
	},
	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},
	'change [name=room-type]'(e, t) {
		t.types.set(t.getSearchTypes());
	}
});
