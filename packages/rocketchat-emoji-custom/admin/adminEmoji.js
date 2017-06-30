/* globals RocketChatTabBar */
Template.adminEmoji.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}
		return undefined;
	},
	customemoji() {
		return Template.instance().customemoji();
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
			if (typeof Template.instance().customemoji === 'function') {
				return Template.instance().limit.get() === Template.instance().customemoji().length;
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

Template.adminEmoji.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.filter = new ReactiveVar('');
	this.ready = new ReactiveVar(false);

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.tabBarData = new ReactiveVar();

	RocketChat.TabBar.addButton({
		groups: ['emoji-custom'],
		id: 'add-emoji',
		i18nTitle: 'Custom_Emoji_Add',
		icon: 'icon-plus',
		template: 'adminEmojiEdit',
		order: 1
	});

	RocketChat.TabBar.addButton({
		groups: ['emoji-custom'],
		id: 'admin-emoji-info',
		i18nTitle: 'Custom_Emoji_Info',
		icon: 'icon-cog',
		template: 'adminEmojiInfo',
		order: 2
	});

	this.autorun(function() {
		const limit = (instance.limit != null) ? instance.limit.get() : 0;
		const subscription = instance.subscribe('fullEmojiData', '', limit);
		instance.ready.set(subscription.ready());
	});

	this.customemoji = function() {
		const filter = (instance.filter != null) ? _.trim(instance.filter.get()) : '';

		let query = {};

		if (filter) {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			query = { $or: [ { name: filterReg }, {aliases: filterReg } ] };
		}

		const limit = (instance.limit != null) ? instance.limit.get() : 0;

		return RocketChat.models.EmojiCustom.find(query, { limit, sort: { name: 1 }}).fetch();
	};
});

Template.adminEmoji.onRendered(() =>
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	})
);

Template.adminEmoji.events({
	'keydown #emoji-filter'(e) {
		//stop enter key
		if (e.which === 13) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	'keyup #emoji-filter'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.filter.set(e.currentTarget.value);
	},

	'click .emoji-info'(e, instance) {
		e.preventDefault();
		instance.tabBarData.set(RocketChat.models.EmojiCustom.findOne({_id: this._id}));
		instance.tabBar.open('admin-emoji-info');
	},

	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.limit.set(t.limit.get() + 50);
	}
});
