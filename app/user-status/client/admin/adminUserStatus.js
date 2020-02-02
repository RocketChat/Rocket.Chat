import _ from 'underscore';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

import { TabBar, SideNav, RocketChatTabBar } from '../../../ui-utils';
import { t } from '../../../utils';
import { APIClient } from '../../../utils/client';

const LIST_SIZE = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.adminUserStatus.helpers({
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	customUserStatus() {
		return Template.instance().statuses.get().map((userStatus) => {
			const { _id, name, statusType } = userStatus;
			const localizedStatusType = statusType ? t(statusType) : '';

			return {
				_id,
				name,
				statusType,
				localizedStatusType,
			};
		});
	},
	isLoading() {
		return Template.instance().isLoading.get();
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
			const statuses = instance.statuses.get();
			if (instance.total.get() > statuses.length) {
				instance.offset.set(instance.offset.get() + LIST_SIZE);
			}
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function(item) {
			instance.tabBarData.set({
				status: instance.statuses.get().find((status) => status._id === item._id),
				onSuccess: instance.onSuccessCallback,
			});
			instance.tabBar.showGroup('user-status-custom-selected');
			instance.tabBar.open('admin-user-status-info');
		};
	},
});

Template.adminUserStatus.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);
	this.total = new ReactiveVar(0);
	this.query = new ReactiveVar({});
	this.statuses = new ReactiveVar([]);
	this.isLoading = new ReactiveVar(false);
	this.offset = new ReactiveVar(0);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['user-status-custom', 'user-status-custom-selected'],
		id: 'add-user-status',
		i18nTitle: 'Custom_User_Status_Add',
		icon: 'plus',
		template: 'adminUserStatusEdit',
		order: 1,
	});

	TabBar.addButton({
		groups: ['user-status-custom-selected'],
		id: 'admin-user-status-info',
		i18nTitle: 'Custom_User_Status_Info',
		icon: 'customize',
		template: 'adminUserStatusInfo',
		order: 2,
	});

	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadStatus(this.query.get(), this.offset.get());
	};

	this.tabBarData.set({
		onSuccess: instance.onSuccessCallback,
	});

	this.loadStatus = _.debounce(async (query, offset) => {
		this.isLoading.set(true);
		const { statuses, total } = await APIClient.v1.get('custom-user-status.list', {
			count: LIST_SIZE,
			offset,
			query: JSON.stringify(query),
		});
		this.total.set(total);
		if (offset === 0) {
			this.statuses.set(statuses);
		} else {
			this.statuses.set(this.statuses.get().concat(statuses));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadStatus({ name: regex }, offset);
		}
		return this.loadStatus({}, offset);
	});
});

Template.adminUserStatus.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}),
);

Template.adminUserStatus.events({
	'keydown #user-status-filter'(e) {
		// stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #user-status-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
		t.offset.set(0);
	},

	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},
});
