import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { RocketChatTabBar, SideNav, TabBar } from '../../../ui-utils';
import { APIClient } from '../../../utils/client';

const LIST_SIZE = 50;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.adminEmoji.helpers({
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	customemoji() {
		return Template.instance().emojis.get();
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
			if ((currentTarget.offsetHeight + currentTarget.scrollTop) < (currentTarget.scrollHeight - 100)) {
				return;
			}
			const emojis = instance.emojis.get();
			if (instance.total.get() > emojis.length) {
				instance.offset.set(instance.offset.get() + LIST_SIZE);
			}
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function({ _id }) {
			instance.tabBarData.set({
				emoji: instance.emojis.get().find((emoji) => emoji._id === _id),
				onSuccess: instance.onSuccessCallback,
			});
			instance.tabBar.open('admin-emoji-info');
		};
	},
});

Template.adminEmoji.onCreated(async function() {
	const instance = this;
	this.emojis = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.filter = new ReactiveVar('');
	this.query = new ReactiveVar({});
	this.isLoading = new ReactiveVar(false);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['emoji-custom'],
		id: 'add-emoji',
		i18nTitle: 'Custom_Emoji_Add',
		icon: 'plus',
		template: 'adminEmojiEdit',
		order: 1,
	});

	TabBar.addButton({
		groups: ['emoji-custom'],
		id: 'admin-emoji-info',
		i18nTitle: 'Custom_Emoji_Info',
		icon: 'customize',
		template: 'adminEmojiInfo',
		order: 2,
	});
	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadEmojis(this.query.get(), this.offset.get());
	};
	this.tabBarData.set({
		onSuccess: instance.onSuccessCallback,
	});

	this.loadEmojis = _.debounce(async (query, offset) => {
		this.isLoading.set(true);
		const { emojis, total } = await APIClient.v1.get(`emoji-custom.all?count=${ LIST_SIZE }&offset=${ offset }&query=${ JSON.stringify(query) }`);
		this.total.set(total);
		if (offset === 0) {
			this.emojis.set(emojis);
		} else {
			this.emojis.set(this.emojis.get().concat(emojis));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadEmojis({ $or: [{ name: regex }, { aliases: regex }] }, offset);
		}
		return this.loadEmojis({}, offset);
	});
});

Template.adminEmoji.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}),
);

Template.adminEmoji.events({
	'keydown #emoji-filter'(e) {
		// stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #emoji-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
		t.offset.set(0);
	},
});
