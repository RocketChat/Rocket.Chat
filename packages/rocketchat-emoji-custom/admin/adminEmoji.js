/* globals isSetNotNull */
Template.adminEmoji.helpers({
	isReady() {
		if (isSetNotNull(() => Template.instance().ready)) {
			return Template.instance().ready.get();
		}
		return undefined;
	},
	customemoji() {
		return Template.instance().customemoji();
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
			if (typeof Template.instance().customemoji === 'function') {
				return Template.instance().limit.get() === Template.instance().customemoji().length;
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

Template.adminEmoji.onCreated(function() {
	let instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);

	RocketChat.TabBar.addButton({
		groups: ['adminEmoji', 'adminEmoji-selected'],
		id: 'add-emoji',
		i18nTitle: 'Custom_Emoji_Add',
		icon: 'icon-plus',
		template: 'adminEmojiEdit',
		openClick(/*e, t*/) {
			RocketChat.TabBar.setData();
			return true;
		},
		order: 1
	});

	RocketChat.TabBar.addButton({
		groups: ['adminEmoji-selected'],
		id: 'admin-emoji-info',
		i18nTitle: 'Custom_Emoji_Info',
		icon: 'icon-cog',
		template: 'adminEmojiInfo',
		order: 2
	});

	this.autorun(function() {
		let limit = (isSetNotNull(() => instance.limit))? instance.limit.get() : 0;
		let subscription = instance.subscribe('fullEmojiData', '', limit);
		instance.ready.set(subscription.ready());
	});

	this.customemoji = function() {
		let filter = (isSetNotNull(() => instance.filter))? _.trim(instance.filter.get()) : '';

		let query = {};

		if (filter) {
			let filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { $or: [ { name: filterReg }, {aliases: filterReg } ] };
		}

		let limit = (isSetNotNull(() => instance.limit))? instance.limit.get() : 0;

		return RocketChat.models.EmojiCustom.find(query, { limit: limit, sort: { name: 1 }}).fetch();
	};
});

Template.adminEmoji.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	})
);

Template.adminEmoji.events({
	['keydown #emoji-filter'](e) {
		//stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	['keyup #emoji-filter'](e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},

	['click .emoji-info'](e) {
		e.preventDefault();
		RocketChat.TabBar.setTemplate('adminEmojiInfo');
		RocketChat.TabBar.setData(RocketChat.models.EmojiCustom.findOne({_id: this._id}));
		RocketChat.TabBar.openFlex();
		RocketChat.TabBar.showGroup('adminEmoji-selected');
	},

	['click .load-more'](e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	}
});
