import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Roles } from '../../../models';
import { API } from '../api';
import { getUsersInRole, hasPermission } from '../../../authorization/server';

API.v1.addRoute('roles.list', { authRequired: true }, {
	get() {
		const roles = Roles.find({}, { fields: { _updatedAt: 0 } }).fetch();

		return API.v1.success({ roles });
	},
});

API.v1.addRoute('roles.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			name: String,
			scope: Match.Maybe(String),
			description: Match.Maybe(String),
		});

		const roleData = {
			name: this.bodyParams.name,
			scope: this.bodyParams.scope,
			description: this.bodyParams.description,
		};

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('authorization:saveRole', roleData);
		});

		return API.v1.success({
			role: Roles.findOneByIdOrName(roleData.name, { fields: API.v1.defaultFieldsToExclude }),
		});
	},
});

API.v1.addRoute('roles.addUserToRole', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			roleName: String,
			username: String,
			roomId: Match.Maybe(String),
		});

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('authorization:addUserToRole', this.bodyParams.roleName, user.username, this.bodyParams.roomId);
		});

		return API.v1.success({
			role: Roles.findOneByIdOrName(this.bodyParams.roleName, { fields: API.v1.defaultFieldsToExclude }),
		});
	},
});

API.v1.addRoute('roles.getUsersInRole', { authRequired: true }, {
	get() {
		const { roomId, role } = this.queryParams;
		const { offset, count = 50 } = this.getPaginationItems();

		const fields = {
			name: 1,
			username: 1,
			emails: 1,
		};

		if (!role) {
			throw new Meteor.Error('error-param-not-provided', 'Query param "role" is required');
		}
		if (!hasPermission(this.userId, 'access-permissions')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}
		if (roomId && !hasPermission(this.userId, 'view-other-user-channels')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}
		const users = getUsersInRole(role, roomId, {
			limit: count,
			sort: { username: 1 },
			skip: offset,
			fields,
		}).fetch();
		return API.v1.success({ users });
	},
});
