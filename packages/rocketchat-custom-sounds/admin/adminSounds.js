/* globals isSetNotNull */
Template.adminSounds.helpers({
	isReady() {
		if (isSetNotNull(() => Template.instance().ready)) {
			return Template.instance().ready.get();
		}
		return undefined;
	},
	customsounds() {
		return Template.instance().customsounds();
	},
	isLoading() {
		if (isSetNotNull(() => Template.instance().ready)) {
			if (!Template.instance().ready.get()) {
				return 'btn-loading';
			}
		}
	},
	hasMore() {
		if (isSetNotNull(() => Template.instance().limit)) {
			if (typeof Template.instance().customsounds === 'function') {
				return Template.instance().limit.get() === Template.instance().customsounds().length;
			}
		}
		return false;
	},
	flexTemplate() {
		return RocketChat.TabBar.getTemplate();
	},
	flexData() {
		return RocketChat.TabBar.getData();
	}
});

Template.adminSounds.onCreated(function() {
	let instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);

	RocketChat.TabBar.addButton({
		groups: ['adminSounds', 'adminSounds-selected'],
		id: 'add-sound',
		i18nTitle: 'Custom_Sound_Add',
		icon: 'icon-plus',
		template: 'adminSoundEdit',
		openClick(/*e, t*/) {
			RocketChat.TabBar.setData();
			return true;
		},
		order: 1
	});

	RocketChat.TabBar.addButton({
		groups: ['adminSounds-selected'],
		id: 'admin-sound-info',
		i18nTitle: 'Custom_Sound_Info',
		icon: 'icon-cog',
		template: 'adminSoundInfo',
		order: 2
	});

	this.autorun(function() {
		let limit = (isSetNotNull(() => instance.limit))? instance.limit.get() : 0;
		let subscription = instance.subscribe('customSounds', '', limit);
		instance.ready.set(subscription.ready());
	});

	this.customsounds = function() {
		let filter = (isSetNotNull(() => instance.filter))? _.trim(instance.filter.get()) : '';

		let query = {};

		if (filter) {
			let filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { name: filterReg };
		}

		let limit = (isSetNotNull(() => instance.limit))? instance.limit.get() : 0;

		return RocketChat.models.CustomSounds.find(query, { limit: limit, sort: { name: 1 }}).fetch();
	};
});

Template.adminSounds.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	})
);

Template.adminSounds.events({
	['keydown #sound-filter'](e) {
		//stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	['keyup #sound-filter'](e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},

	['click .sound-info'](e) {
		e.preventDefault();
		RocketChat.TabBar.setTemplate('adminSoundInfo');
		RocketChat.TabBar.setData(RocketChat.models.CustomSounds.findOne({_id: this._id}));
		RocketChat.TabBar.openFlex();
		RocketChat.TabBar.showGroup('adminSounds-selected');
	},

	['click .load-more'](e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	},

	['click .icon-play-circled'](e) {
		e.preventDefault();
		e.stopPropagation();
		const $audio = $('audio#' + this._id);
		if ($audio && $audio[0] && $audio[0].play) {
			$audio[0].play();
		}
	}
});
