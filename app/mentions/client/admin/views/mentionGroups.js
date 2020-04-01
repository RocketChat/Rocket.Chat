import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import s from 'underscore.string';

import { SideNav, RocketChatTabBar, TabBar } from '../../../../ui-utils';
import { MentionGroups } from '../../../../models';
import { t } from '../../../../utils';

Template.mentionGroups.helpers({
	fieldCount(group, field) {
		return group[field] ? group[field].length || '' : '';
	},
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	groups() {
		return Template.instance().groups();
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
	groupCount() {
		const groups = Template.instance().groups();
		return groups && groups.count();
	},
	type() {
		return '';
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
});

Template.mentionGroups.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.types = new ReactiveVar([]);
	this.ready = new ReactiveVar(true);
	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	TabBar.addButton({
		groups: ['admin-mention-groups'],
		id: 'admin-mention-group-add',
		i18nTitle: 'Mentions_SettingsAdd',
		icon: 'plus',
		template: 'mentionGroupSettings',
		order: 1,
	});
	TabBar.addButton({
		groups: ['admin-mention-groups'],
		id: 'admin-mention-group',
		i18nTitle: 'Mentions_Settings',
		icon: 'customize',
		template: 'mentionGroupSettings',
		order: 1,
	});
	this.autorun(function() {
		const filter = instance.filter.get();
		const limit = instance.limit.get();
		const subscription = instance.subscribe('mentionGroups', filter, limit);
		instance.ready.set(subscription.ready());
	});
	this.groups = function() {
		let filter;
		if (instance.filter && instance.filter.get()) {
			filter = s.trim(instance.filter.get());
		}
		let query = {};
		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { name: filterReg };
		}

		const limit = instance.limit && instance.limit.get();
		return MentionGroups.find(query, { limit, sort: { default: -1, name: 1 } });
	};
});

Template.mentionGroups.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.mentionGroups.events({

});
