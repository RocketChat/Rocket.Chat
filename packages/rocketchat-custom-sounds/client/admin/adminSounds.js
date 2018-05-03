import s from 'underscore.string';

import { RocketChatTabBar } from 'meteor/rocketchat:lib';

Template.adminSounds.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}
		return undefined;
	},
	customsounds() {
		return Template.instance().customsounds();
	},
	isLoading() {
		if (Template.instance().ready != null) {
			if (!Template.instance().ready.get()) {
				return 'btn-loading';
			}
		}
	},
	hasMore() {
		if (Template.instance().limit != null) {
			if (typeof Template.instance().customsounds === 'function') {
				return Template.instance().limit.get() === Template.instance().customsounds().length;
			}
		}
		return false;
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get()
		};
	}
});

Template.adminSounds.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	RocketChat.TabBar.addButton({
		groups: ['custom-sounds', 'custom-sounds-selected'],
		id: 'add-sound',
		i18nTitle: 'Custom_Sound_Add',
		icon: 'plus',
		template: 'adminSoundEdit',
		openClick(/*e, t*/) {
			instance.tabBarData.set();
			return true;
		},
		order: 1
	});

	RocketChat.TabBar.addButton({
		groups: ['custom-sounds-selected'],
		id: 'admin-sound-info',
		i18nTitle: 'Custom_Sound_Info',
		icon: 'customize',
		template: 'adminSoundInfo',
		order: 2
	});

	this.autorun(function() {
		const limit = (instance.limit != null) ? instance.limit.get() : 0;
		const subscription = instance.subscribe('customSounds', '', limit);
		instance.ready.set(subscription.ready());
	});

	this.customsounds = function() {
		const filter = (instance.filter != null) ? s.trim(instance.filter.get()) : '';

		let query = {};

		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { name: filterReg };
		}

		const limit = (instance.limit != null) ? instance.limit.get() : 0;

		return RocketChat.models.CustomSounds.find(query, { limit, sort: { name: 1 }}).fetch();
	};
});

Template.adminSounds.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	})
);

Template.adminSounds.events({
	'keydown #sound-filter'(e) {
		//stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #sound-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},

	'click .sound-info'(e, instance) {
		e.preventDefault();
		instance.tabBarData.set(RocketChat.models.CustomSounds.findOne({_id: this._id}));
		instance.tabBar.showGroup('custom-sounds-selected');
		instance.tabBar.open('admin-sound-info');
	},

	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},

	'click .icon-play-circled'(e) {
		e.preventDefault();
		e.stopPropagation();
		const $audio = $(`audio#${ this._id }`);
		if ($audio && $audio[0] && $audio[0].play) {
			$audio[0].play();
		}
	}
});
