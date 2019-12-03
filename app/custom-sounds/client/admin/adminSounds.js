import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { RocketChatTabBar, SideNav, TabBar } from '../../../ui-utils';
import { CustomSounds } from '../lib/CustomSounds';
import { APIClient } from '../../../utils/client';

const SOUNDS_COUNT = 25;
const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.adminSounds.helpers({
	searchText() {
		const instance = Template.instance();
		return instance.filter && instance.filter.get();
	},
	customsounds() {
		return Template.instance().sounds.get();
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
			const sounds = instance.sounds.get();
			if (instance.total.get() > sounds.length) {
				instance.offset.set(instance.offset.get() + SOUNDS_COUNT);
			}
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function(item) {
			instance.tabBarData.set({
				sound: instance.sounds.get().find((sound) => sound._id === item._id),
				onSuccess: instance.onSuccessCallback,
			});
			instance.tabBar.showGroup('custom-sounds-selected');
			instance.tabBar.open('admin-sound-info');
		};
	},
});

Template.adminSounds.onCreated(function() {
	const instance = this;
	this.sounds = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.query = new ReactiveVar({});
	this.isLoading = new ReactiveVar(false);
	this.filter = new ReactiveVar('');

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['custom-sounds', 'custom-sounds-selected'],
		id: 'add-sound',
		i18nTitle: 'Custom_Sound_Add',
		icon: 'plus',
		template: 'adminSoundEdit',
		order: 1,
	});

	TabBar.addButton({
		groups: ['custom-sounds-selected'],
		id: 'admin-sound-info',
		i18nTitle: 'Custom_Sound_Info',
		icon: 'customize',
		template: 'adminSoundInfo',
		order: 2,
	});

	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadSounds(this.query.get(), this.offset.get());
	};

	this.tabBarData.set({
		onSuccess: instance.onSuccessCallback,
	});

	this.loadSounds = _.debounce(async (query, offset) => {
		this.isLoading.set(true);
		const { sounds, total } = await APIClient.v1.get(`custom-sounds.list?count=${ SOUNDS_COUNT }&offset=${ offset }&query=${ JSON.stringify(query) }`);
		this.total.set(total);
		if (offset === 0) {
			this.sounds.set(sounds);
		} else {
			this.sounds.set(this.sounds.get().concat(sounds));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadSounds({ name: regex }, offset);
		}
		return this.loadSounds({}, offset);
	});
});

Template.adminSounds.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	})
);

Template.adminSounds.events({
	'keydown #sound-filter'(e) {
		// stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},
	'keyup #sound-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
		t.offset.set(0);
	},
	'click .icon-play-circled'(e) {
		e.preventDefault();
		e.stopPropagation();
		CustomSounds.play(this._id);
	},
	'click .icon-pause-circled'(e) {
		e.preventDefault();
		e.stopPropagation();
		const audio = document.getElementById(this._id);
		if (audio && !audio.paused) {
			audio.pause();
		}
	},
	'click .icon-reset-circled'(e) {
		e.preventDefault();
		e.stopPropagation();
		const audio = document.getElementById(this._id);
		if (audio) {
			audio.currentTime = 0;
		}
	},
});
