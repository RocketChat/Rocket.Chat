import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import s from 'underscore.string';

import { SideNav, RocketChatTabBar, TabBar } from '../../../ui-utils';
import { t, roomTypes } from '../../../utils';
import { hasAllPermission } from '../../../authorization';
import { ChannelSettings } from '../../../channel-settings';

export const AdminChatRoom = new Mongo.Collection('rocketchat_room');

Template.adminRooms.helpers({
	url() {
		return roomTypes.getConfig(this.t).getAvatarPath(this);
	},
	getIcon() {
		return roomTypes.getIcon(this);
	},
	roomName() {
		return roomTypes.getRoomName(this.t, this);
	},
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
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
		return roomTypes.roomTypes[this.t].getDisplayName(this);
	},
	type() {
		return TAPi18n.__(roomTypes.roomTypes[this.t].label);
	},
	'default'() {
		if (this.default) {
			return t('True');
		}
		return t('False');
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
		};
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (
				currentTarget.offsetHeight + currentTarget.scrollTop
				>= currentTarget.scrollHeight - 100
			) {
				return instance.limit.set(instance.limit.get() + 50);
			}
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function(item) {
			Session.set('adminRoomsSelected', {
				rid: item._id,
			});
			instance.tabBar.open('admin-room');
		};
	},

});

Template.adminRooms.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.types = new ReactiveVar([]);
	this.ready = new ReactiveVar(true);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	TabBar.addButton({
		groups: ['admin-rooms'],
		id: 'admin-room',
		i18nTitle: 'Room_Info',
		icon: 'info-circled',
		template: 'adminRoomInfo',
		order: 1,
	});
	ChannelSettings.addOption({
		group: ['admin-room'],
		id: 'make-default',
		template: 'channelSettingsDefault',
		data() {
			return Session.get('adminRoomsSelected');
		},
		validation() {
			return hasAllPermission('view-room-administration');
		},
	});
	const allowedTypes = ['c', 'd', 'p'];
	this.autorun(function() {
		const filter = instance.filter.get();
		let types = instance.types.get();
		if (types.length === 0) {
			types = allowedTypes;
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
		const discussion = types.includes('dicussions');
		filter = s.trim(filter);
		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { ...discussion && { prid: { $exists: true } }, $or: [{ name: filterReg }, { t: 'd', usernames: filterReg }] };
		}

		if (types.filter((type) => type !== 'dicussions').length) {
			query.t = { $in: types.filter((type) => type !== 'dicussions') };
		}
		const limit = instance.limit && instance.limit.get();
		return AdminChatRoom.find(query, { limit, sort: { default: -1, name: 1 } });
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
	'change [name=room-type]'(e, t) {
		t.types.set(t.getSearchTypes());
	},
});
