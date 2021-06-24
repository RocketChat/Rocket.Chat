import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { RocketChatTabBar, SideNav, TabBar } from '../../../ui-utils';

Template.adminOembed.helpers({
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	oembed() {
		return Template.instance().oembeds.get();
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
	preloadedClass(preloaded) {
		if (preloaded) { return 'oembed-preloaded'; }
		return '';
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function({ _id }) {
			instance.tabBarData.set({
				oembed: instance.oembeds.get().find((oembed) => oembed._id === _id),
				onSuccess: instance.onSuccessCallback,
			});
			instance.tabBar.open('admin-oembed-info');
		};
	},
});

Template.adminOembed.onCreated(async function() {
	const instance = this;
	this.oembeds = new ReactiveVar([]);
	this.filter = new ReactiveVar('');
	this.isLoading = new ReactiveVar(true);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['oembed'],
		id: 'add-oembed',
		i18nTitle: 'OEmbed_Add',
		icon: 'plus',
		template: 'adminOembedEdit',
		order: 1,
	});

	TabBar.addButton({
		groups: ['oembed'],
		id: 'admin-oembed-info',
		i18nTitle: 'OEmbed_Info',
		icon: 'customize',
		template: 'adminOembedInfo',
		order: 2,
	});

	this.onSuccessCallback = () => this.loadOembeds();
	this.tabBarData.set({
		onSuccess: instance.onSuccessCallback,
	});

	this.loadOembeds = () => {
		this.isLoading.set(true);
		const filter = this.filter.get() && this.filter.get().trim();

		let query = {};

		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			query = { endPoint: regex };
		}

		Meteor.call('listOembed', query, { sort: { endPoint: 1 } }, (error, result) => {
			this.oembeds.set(result);
			this.isLoading.set(false);
		});
	};

	this.autorun(() => this.loadOembeds());
});

Template.adminOembed.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}),
);

Template.adminOembed.events({
	'keydown #oembed-filter'(e) {
		// stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #oembed-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},
});
