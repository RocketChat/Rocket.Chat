import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Roles } from 'meteor/rocketchat:models';
import { API } from '../api';

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
