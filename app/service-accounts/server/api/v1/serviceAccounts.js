import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { API } from '../../../../api';
import { Users } from '../../../../models';

API.v1.addRoute('serviceAccounts.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			name: String,
			password: String,
			username: String,
			description: String,
		});
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addServiceAccount', this.bodyParams);
		});
		return API.v1.success({ user: Users.findOneByUsername(this.bodyParams.username, { fields: API.v1.defaultFieldsToExclude }) });
	},
});
