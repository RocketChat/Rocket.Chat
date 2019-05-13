import { check } from 'meteor/check';
import _ from 'underscore';

import { hasPermission, getUsersInRole } from '../../../../authorization';
import { API } from '../../../../api';
import { Users } from '../../../../models';
import { Livechat } from '../../../server/lib/Livechat';

API.v1.addRoute('livechat/users/:type', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
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
				throw new Error('Invalid type');
			}

			const users = getUsersInRole(role);

			return API.v1.success({
				users: users.fetch().map((user) => _.pick(user, '_id', 'username', 'name', 'status', 'statusLivechat')),
			});
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
	post() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
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
				const user = Livechat.addAgent(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else if (this.urlParams.type === 'manager') {
				const user = Livechat.addManager(this.bodyParams.username);
				if (user) {
					return API.v1.success({ user });
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
});

API.v1.addRoute('livechat/users/:type/:_id', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				type: String,
				_id: String,
			});

			const user = Users.findOneById(this.urlParams._id);

			if (!user) {
				return API.v1.failure('User not found');
			}

			let role;

			if (this.urlParams.type === 'agent') {
				role = 'livechat-agent';
			} else if (this.urlParams.type === 'manager') {
				role = 'livechat-manager';
			} else {
				throw new Error('Invalid type');
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
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				type: String,
				_id: String,
			});

			const user = Users.findOneById(this.urlParams._id);

			if (!user) {
				return API.v1.failure();
			}

			if (this.urlParams.type === 'agent') {
				if (Livechat.removeAgent(user.username)) {
					return API.v1.success();
				}
			} else if (this.urlParams.type === 'manager') {
				if (Livechat.removeManager(user.username)) {
					return API.v1.success();
				}
			} else {
				throw new Error('Invalid type');
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
});
