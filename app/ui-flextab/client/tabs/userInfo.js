import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { HTML } from 'meteor/htmljs';
import _ from 'underscore';
import s from 'underscore.string';

import { DateFormat } from '../../../lib';
import { RoomRoles, UserRoles, Roles } from '../../../models';
import { settings } from '../../../settings';
import './userInfo.html';
import { Markdown } from '../../../markdown/lib/markdown';
import { createTemplateForComponent } from '../../../../client/reactAdapters';

createTemplateForComponent('UserInfoWithData', () => import('../../../../client/channel/UserInfo'), {
	// eslint-disable-next-line new-cap
	renderContainerView: () => HTML.DIV({ class: 'contextual-bar', style: 'flex-grow: 1;' }),
});

Template.userInfo.helpers({
	onClose() {
		const instance = Template.instance();
		return () => {
			instance.clear();
		};
	},
	username() {
		return Template.currentData().username;
	},
	linkedinUsername() {
		const user = Template.instance().user.get();
		if (user && user.services && user.services.linkedin && user.services.linkedin.publicProfileUrl) {
			return s.strRight(user.services.linkedin.publicProfileUrl, '/in/');
		}
	},

	servicesMeteor() {
		const user = Template.instance().user.get();
		return user && user.services && user.services['meteor-developer'];
	},

	userTime() {
		const user = Template.instance().user.get();
		if (user && user.utcOffset != null) {
			return DateFormat.formatTime(Template.instance().now.get().utcOffset(user.utcOffset));
		}
	},

	user() {
		return Template.instance().user.get();
	},

	hasEmails() {
		return _.isArray(this.emails);
	},

	hasPhone() {
		return _.isArray(this.phone);
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
			back({ _id, username }) {
				instance.editingUser.set();

				if (_id) {
					data.onChange && data.onChange();
					return instance.loadUser({ _id });
				}

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
	hasBio() {
		const user = Template.instance().user.get();
		return user.bio && user.bio.trim();
	},
	nickname() {
		const user = Template.instance().user.get();
		return user.nickname?.trim();
	},
	bio() {
		const user = Template.instance().user.get();
		return Markdown.parse(user.bio);
	},
	roleTags() {
		const user = Template.instance().user.get();
		if (!user || !user._id) {
			return;
		}
		const userRoles = UserRoles.findOne(user._id) || {};
		const roomRoles = RoomRoles.findOne({ 'u._id': user._id, rid: Session.get('openedRoom') }) || {};
		const roles = _.union(userRoles.roles || [], roomRoles.roles || []);
		return roles.length && Roles.find({ _id: { $in: roles }, description: { $exists: 1 } }, { fields: { description: 1 } });
	},

	shouldDisplayReason() {
		const user = Template.instance().user.get();
		return settings.get('Accounts_ManuallyApproveNewUsers') && user.active === false && user.reason;
	},
});

Template.userInfo.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			this.clear = data.clear;
		}
	});
});
