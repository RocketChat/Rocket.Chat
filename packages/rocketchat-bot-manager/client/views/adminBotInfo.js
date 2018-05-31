import moment from 'moment';

Template.adminBotInfo.helpers({
	hideHeader() {
		return ['Template.adminBotInfo', 'adminBotInfo'].includes(Template.parentData(2).viewName);
	},

	name() {
		const bot = Template.instance().bot.get();
		return bot && bot.name ? bot.name : TAPi18n.__('Unnamed');
	},

	username() {
		const bot = Template.instance().bot.get();
		return bot && bot.username;
	},

	botStatus() {
		const bot = Template.instance().bot.get();
		const botStatus = Session.get(`user_${ bot.username }_status`);
		return botStatus;
	},

	framework() {
		const bot = Template.instance().bot.get();
		if (bot.botData && bot.botData.framework) {
			return bot.botData.framework;
		}
		return 'Undefined';
	},

	lastLogin() {
		const bot = Template.instance().bot.get();
		if (bot && bot.lastLogin) {
			return moment(bot.lastLogin).format('LLL');
		}
	},

	createdAt() {
		const bot = Template.instance().bot.get();
		if (bot && bot.createdAt) {
			return false && moment(bot.createdAt).format('LLL');
		}
	},

	botTime() {
		const bot = Template.instance().bot.get();
		if (bot && bot.utcOffset != null) {
			return Template.instance().now.get().utcOffset(bot.utcOffset).format(RocketChat.settings.get('Message_TimeFormat'));
		}
	},

	bot() {
		return Template.instance().bot.get();
	},

	isLoading() {
		return Template.instance().loadingBotInfo.get();
	},

	roleTags() {
		const bot = Template.instance().bot.get();
		if (!bot || !bot._id) {
			return;
		}
		const roles = bot.roles;
		return roles.length && RocketChat.models.Roles.find({ _id: { $in: roles }, description: { $exists: 1 } }, { fields: { description: 1 } });
	}
});

Template.adminBotInfo.events({
	'click .js-more-details'(e) {
		e.preventDefault();
		const bot = Template.instance().bot.get();
		if (!bot || !bot._id) {
			return;
		}
		FlowRouter.go(`/admin/bots/${ bot.username }`);
	},
	'click .js-close-info'(e, instance) {
		return instance.clear();
	},
	'click .js-back'(e, instance) {
		return instance.clear();
	}
});

Template.adminBotInfo.onCreated(function() {
	this.now = new ReactiveVar(moment());
	this.bot = new ReactiveVar;
	this.loadingBotInfo = new ReactiveVar(true);
	this.loadedBotUsername = new ReactiveVar;
	this.tabBar = Template.currentData().tabBar;

	Meteor.setInterval(() => this.now.set(moment()), 30000);

	this.autorun(() => {
		const username = this.loadedBotUsername.get();

		if (username == null) {
			this.loadingBotInfo.set(false);
			return;
		}

		this.loadingBotInfo.set(true);

		return this.subscribe('fullUserData', username, 1, () => {
			return this.loadingBotInfo.set(false);
		});
	});

	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			return this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const bot = this.bot.get();
		return this.loadedBotUsername.set((bot != null ? bot.username : undefined) || (data != null ? data.username : undefined));
	});

	return this.autorun(() => {
		let filter;
		const data = Template.currentData();
		if (data && data.username != null) {
			filter = { username: data.username };
		} else if (data && data._id != null) {
			filter = { _id: data._id };
		}
		const bot = Meteor.users.findOne(filter);
		return this.bot.set(bot);
	});
});
