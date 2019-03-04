import moment from 'moment';
import toastr from 'toastr';
import * as Models from 'meteor/rocketchat:models';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { FlowRouter } from 'meteor/kadira:flow-router' ;
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

Template.adminBotInfo.helpers({
	hideHeader() {
		return ['Template.adminBotInfo', 'adminBotInfo'].includes(Template.parentData(1).viewName);
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
		if (bot.customClientData && bot.customClientData.framework) {
			return bot.customClientData.framework;
		}
		return TAPi18n.__('Undefined');
	},

	lastLogin() {
		const bot = Template.instance().bot.get();
		if (bot && bot.lastLogin) {
			return moment(bot.lastLogin).format('LLL');
		}
	},

	bot() {
		return Template.instance().bot.get();
	},

	canPauseResumeMsgStream() {
		const bot = Template.instance().bot.get();
		return bot.customClientData && bot.customClientData.canPauseResumeMsgStream;
	},

	isPaused() {
		const bot = Template.instance().bot.get();
		if (bot.customClientData) {
			return bot.customClientData.pausedMsgStream;
		}
	},

	isOnline() {
		const bot = Template.instance().bot.get();
		if (bot.statusConnection && bot.statusConnection !== 'offline') {
			return true;
		}
		return false;
	},

	isLoading() {
		return Template.instance().loadingBotInfo.get();
	},

	roleTags() {
		const bot = Template.instance().bot.get();
		if (!bot || !bot._id) {
			return;
		}
		const { roles } = bot;
		return roles.length && Models.Roles.find({ _id: { $in: roles }, description: { $exists: 1 } }, { fields: { description: 1 } });
	},
});

Template.adminBotInfo.events({
	'click .js-more-details'(e) {
		e.preventDefault();
		const bot = Template.instance().bot.get();
		if (!bot || !bot._id) {
			return;
		}
		FlowRouter.go('admin-bots-username', { username: bot.username });
	},
	'click .js-close-info'(e, instance) {
		return instance.clear();
	},
	'click .js-back'(e, instance) {
		return instance.clear();
	},
	'click .resume': (e, t) => {
		const bot = t.bot.get();
		Meteor.call('resumeBot', bot, (err) => {
			if (err) {
				return toastr.error(TAPi18n.__('Bot_resumed_error'));
			}
			toastr.success(TAPi18n.__('Bot_resumed'));
		});
	},
	'click .pause': (e, t) => {
		const bot = t.bot.get();
		Meteor.call('pauseBot', bot, (err) => {
			if (err) {
				return toastr.error(TAPi18n.__('Bot_paused_error'));
			}
			toastr.success(TAPi18n.__('Bot_paused'));
		});
	},
});

Template.adminBotInfo.onCreated(function() {
	this.bot = new ReactiveVar;
	this.loadingBotInfo = new ReactiveVar(true);
	this.loadedBotUsername = new ReactiveVar;
	this.tabBar = Template.currentData().tabBar;

	this.autorun(() => {
		const username = this.loadedBotUsername.get();

		if (username == null) {
			this.loadingBotInfo.set(false);
			return;
		}

		this.loadingBotInfo.set(true);

		return this.subscribe('fullUserData', username, 1, () => this.loadingBotInfo.set(false));
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
