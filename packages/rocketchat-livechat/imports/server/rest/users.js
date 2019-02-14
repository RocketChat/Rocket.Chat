import { check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import { API } from 'meteor/rocketchat:api';
import _ from 'underscore';

API.v1.addRoute('livechat/users/:type', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				type: String,
			});

			let role;
			if (this.urlParams.type === 'agent') {
				role = 'livechat-agent';
			} else if (this.urlParams.type === 'manager') {
				role = 'livechat-manager';
			} else {
				throw 'Invalid type';
			}

			const users = RocketChat.authz.getUsersInRole(role);

			return API.v1.success({
				users: users.fetch().map((user) => _.pick(user, '_id', 'username', 'name', 'status', 'statusLivechat')),
			});
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}
		try {
			check(this.urlParams, {
				type: String,
			});

			check(this.bodyParams, {
				username: String,
			});

			if (this.urlParams.type === 'agent') {
				const user = RocketChat.Livechat.addAgent(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else if (this.urlParams.type === 'manager') {
				const user = RocketChat.Livechat.addManager(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else {
				throw 'Invalid type';
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
});

API.v1.addRoute('livechat/users/:type/:_id', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				type: String,
				_id: String,
			});

			const user = RocketChat.models.Users.findOneById(this.urlParams._id);

			if (!user) {
				return API.v1.failure('User not found');
			}

			let role;

			if (this.urlParams.type === 'agent') {
				role = 'livechat-agent';
			} else if (this.urlParams.type === 'manager') {
				role = 'livechat-manager';
			} else {
				throw 'Invalid type';
			}

			if (user.roles.indexOf(role) !== -1) {
				return API.v1.success({
					user: _.pick(user, '_id', 'username'),
				});
			}

			return API.v1.success({
				user: null,
			});
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
	delete() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				type: String,
				_id: String,
			});

			const user = RocketChat.models.Users.findOneById(this.urlParams._id);

			if (!user) {
				return API.v1.failure();
			}

			if (this.urlParams.type === 'agent') {
				if (RocketChat.Livechat.removeAgent(user.username)) {
					return API.v1.success();
				}
			} else if (this.urlParams.type === 'manager') {
				if (RocketChat.Livechat.removeManager(user.username)) {
					return API.v1.success();
				}
			} else {
				throw 'Invalid type';
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
});
