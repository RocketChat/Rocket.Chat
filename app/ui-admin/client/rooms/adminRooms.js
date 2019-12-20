import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import { SideNav, RocketChatTabBar, TabBar } from '../../../ui-utils';
import { t, roomTypes } from '../../../utils';
import { hasAllPermission } from '../../../authorization';
import { ChannelSettings } from '../../../channel-settings';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';
import { APIClient } from '../../../utils/client';

const LIST_SIZE = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.adminRooms.helpers({
	url() {
		return this.t === 'd' ? getAvatarURL({ username: `@${ this.usernames[0] }` }) : roomTypes.getConfig(this.t).getAvatarPath(this);
	},
	getIcon() {
		return roomTypes.getIcon(this);
	},
	roomName() {
		return this.t === 'd' ? this.usernames.join(' x ') : roomTypes.getRoomName(this.t, this);
	},
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	rooms() {
		return Template.instance().rooms.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	roomCount() {
		return Template.instance().rooms.get().length;
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
			data: Template.instance().tabBarData.get(),
		};
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const rooms = instance.rooms.get();
			if (instance.total.get() > rooms.length) {
				instance.offset.set(instance.offset.get() + LIST_SIZE);
			}
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function(item) {
			Session.set('adminRoomsSelected', {
				rid: item._id,
			});
			instance.tabBarData.set({
				room: instance.rooms.get().find((room) => room._id === item._id),
				onSuccess: instance.onSuccessCallback,
			});
			instance.tabBar.open('admin-room');
		};
	},

});

Template.adminRooms.onCreated(function() {
	const instance = this;
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.filter = new ReactiveVar('');
	this.types = new ReactiveVar([]);
	this.rooms = new ReactiveVar([]);
	this.ready = new ReactiveVar(true);
	this.isLoading = new ReactiveVar(false);
	this.tabBar = new RocketChatTabBar();
	this.tabBarData = new ReactiveVar();
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
			return {
				session: Session.get('adminRoomsSelected'),
				data: instance.tabBarData.get(),
			};
		},
		validation() {
			return hasAllPermission('view-room-administration');
		},
	});

	this.onSuccessCallback = () => {
		instance.offset.set(0);
		return instance.loadRooms(instance.types.get(), instance.filter.get(), instance.offset.get());
	};

	this.tabBarData.set({
		onSuccess: instance.onSuccessCallback,
	});

	const mountTypesQueryParameter = (types) => types.reduce((acc, item) => {
		acc += `types[]=${ item }&`;
		return acc;
	}, '');

	this.loadRooms = _.debounce(async (types = [], filter, offset) => {
		this.isLoading.set(true);
		let url = `rooms.adminRooms?count=${ LIST_SIZE }&offset=${ offset }&${ mountTypesQueryParameter(types) }`;
		if (filter) {
			url += `filter=${ encodeURIComponent(filter) }`;
		}
		const { rooms, total } = await APIClient.v1.get(url);
		this.total.set(total);
		if (offset === 0) {
			this.rooms.set(rooms);
		} else {
			this.rooms.set(this.rooms.get().concat(rooms));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	const allowedTypes = ['c', 'd', 'p'];
	this.autorun(() => {
		instance.filter.get();
		instance.types.get();
		instance.offset.set(0);
	});
	this.autorun(() => {
		const filter = instance.filter.get();
		const offset = instance.offset.get();
		let types = instance.types.get();
		if (types.length === 0) {
			types = allowedTypes;
		}
		return this.loadRooms(types, filter, offset);
	});
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
