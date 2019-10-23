import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import s from 'underscore.string';

import './livechatAgentInfo.html';

Template.livechatAgentInfo.helpers({
	hideHeader() {
		return ['Template.adminUserInfo', 'adminUserInfo'].includes(Template.parentData(2).viewName);
	},

	name() {
		const user = Template.instance().user.get();
		return user && user.name ? user.name : TAPi18n.__('Unnamed');
	},

	username() {
		const user = Template.instance().user.get();
		return user && user.username;
	},

	userStatus() {
		const user = Template.instance().user.get();
		const userStatus = Session.get(`user_${ user.username }_status`);
		return userStatus || TAPi18n.__('offline');
	},

	userStatusText() {
		if (s.trim(this.statusText)) {
			return this.statusText;
		}

		const user = Template.instance().user.get();
		const userStatus = Session.get(`user_${ user.username }_status`);
		return userStatus || TAPi18n.__('offline');
	},

	email() {
		const user = Template.instance().user.get();
		return user && user.emails && user.emails[0] && user.emails[0].address;
	},

	user() {
		return Template.instance().user.get();
	},

	hasEmails() {
		return _.isArray(this.emails);
	},

	isLoading() {
		return Template.instance().loadingUserInfo.get();
	},

	editingUser() {
		return Template.instance().editingUser.get();
	},

	userToEdit() {
		const instance = Template.instance();
		const data = Template.currentData();
		return {
			user: instance.user.get(),
			back(username) {
				instance.editingUser.set();

				if (username != null) {
					const user = instance.user.get();
					if ((user != null ? user.username : undefined) !== username) {
						data.username = username;
						return instance.loadedUsername.set(username);
					}
				}
			},
		};
	},

	roleTags() {
		const user = Template.instance().user.get();
		if (!user || !user._id) {
			return;
		}

		return;
		/*
		const userRoles = UserRoles.findOne(user._id) || {};
		const roomRoles = RoomRoles.findOne({ 'u._id': user._id, rid: Session.get('openedRoom') }) || {};
		const roles = _.union(userRoles.roles || [], roomRoles.roles || []);
		return roles.length && Roles.find({ _id: { $in: roles }, description: { $exists: 1 } }, { fields: { description: 1 } });
		*/
	},
});

Template.livechatAgentInfo.events({
	'click .js-close-info'(e, instance) {
		return instance.clear();
	},
	'click .js-back'(e, instance) {
		return instance.clear();
	},
});

Template.livechatAgentInfo.onCreated(function() {
	this.user = new ReactiveVar();

	this.autorun(() => {
		const user = this.user.get();
		if (!user) {
			this.actions.set([]);
		}
	});

	this.editingUser = new ReactiveVar();
	this.loadingUserInfo = new ReactiveVar(true);
	this.loadedUsername = new ReactiveVar();
	this.tabBar = Template.currentData().tabBar;

	this.autorun(() => {
		const username = this.loadedUsername.get();

		if (username == null) {
			this.loadingUserInfo.set(false);
			return;
		}

		this.loadingUserInfo.set(true);

		return this.subscribe('fullUserData', username, 1, () => this.loadingUserInfo.set(false));
	});

	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const user = this.user.get();
		return this.loadedUsername.set((user != null ? user.username : undefined) || (data != null ? data.username : undefined));
	});

	return this.autorun(() => {
		let filter;
		const data = Template.currentData();
		if (data && data.username != null) {
			filter = { username: data.username };
		} else if (data && data._id != null) {
			filter = { _id: data._id };
		}
		const user = {}; //FullUser.findOne(filter);

		return this.user.set(user);
	});
});
