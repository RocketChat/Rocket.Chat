import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { SideNav, TabBar, RocketChatTabBar } from '../../../ui-utils';
import { APIClient } from '../../../utils/client';

const USERS_COUNT = 50;

Template.adminUsers.helpers({
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	users() {
		return Template.instance().users.get();
	},
	isLoading() {
		const instance = Template.instance();
		if (!(instance.ready && instance.ready.get())) {
			return 'btn-loading';
		}
	},
	hasMore() {
		const instance = Template.instance();
		const users = instance.users();
		if (instance.offset && instance.offset.get() && users && users.length) {
			return instance.offset.get() === users.length;
		}
	},
	emailAddress() {
		return _.map(this.emails, function(e) { return e.address; }).join(', ');
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
			if (
				currentTarget.offsetHeight + currentTarget.scrollTop
				>= currentTarget.scrollHeight - 100
			) {
				return instance.offset.set(instance.offset.get() + USERS_COUNT);
			}
		};
	},
	// onTableItemClick() {
	// 	const instance = Template.instance();
	// 	return function(item) {
	// 		Session.set('adminRoomsSelected', {
	// 			rid: item._id,
	// 		});
	// 		instance.tabBar.open('admin-room');
	// 	};
	// },
});

Template.adminUsers.onCreated(function() {
	const instance = this;
	this.offset = new ReactiveVar(0);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(true);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();
	this.users = new ReactiveVar([]);

	TabBar.addButton({
		groups: ['admin-users'],
		id: 'invite-user',
		i18nTitle: 'Invite_Users',
		icon: 'send',
		template: 'adminInviteUser',
		order: 1,
	});
	TabBar.addButton({
		groups: ['admin-users'],
		id: 'add-user',
		i18nTitle: 'Add_User',
		icon: 'plus',
		template: 'adminUserEdit',
		order: 2,
	});
	TabBar.addButton({
		groups: ['admin-users'],
		id: 'admin-user-info',
		i18nTitle: 'User_Info',
		icon: 'user',
		template: 'adminUserInfo',
		order: 3,
	});
	this.autorun(async () => {
		this.ready.set(false);
		const filter = instance.filter.get();
		const offset = instance.offset.get();
		const query = {
			$or: [
				{ 'emails.address': { $regex: filter, $options: 'i' } },
				{ username: { $regex: filter, $options: 'i' } },
				{ name: { $regex: filter, $options: 'i' } },
			],
		};
		let url = `users.list?count=${ USERS_COUNT }&offset=${ offset }`;
		if (filter) {
			url += `&query=${ JSON.stringify(query) }`;
		}
		const { users } = await APIClient.v1.get(url);
		if (offset === 0) {
			this.users.set(users);
		} else {
			this.users.set(this.users.get().concat(users));
		}
		this.ready.set(true);
	});
});

Template.adminUsers.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

const DEBOUNCE_TIME_FOR_SEARCH_USERS_IN_MS = 300;

Template.adminUsers.events({
	'keydown #users-filter'(e) {
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #users-filter': _.debounce((e, t) => {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
		t.offset.set(0);
	}, DEBOUNCE_TIME_FOR_SEARCH_USERS_IN_MS),
	'click .user-info'(e, instance) {
		e.preventDefault();
		instance.tabBarData.set(instance.users.get().find((user) => user._id === this._id));
		instance.tabBar.open('admin-user-info');
	},
	'click .info-tabs button'(e) {
		e.preventDefault();
		$('.info-tabs button').removeClass('active');
		$(e.currentTarget).addClass('active');
		$('.user-info-content').hide();
		$($(e.currentTarget).attr('href')).show();
	},
	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.offset.set(t.offset.get() + USERS_COUNT);
	},
});
