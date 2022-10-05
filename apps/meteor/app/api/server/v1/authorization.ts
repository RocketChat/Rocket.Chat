import { Meteor } from 'meteor/meteor';
import { isAddPermissionProps } from '@rocket.chat/rest-typings';

import { API } from '../api';

API.v1.addRoute(
	'authorization.addPermission',
	{
		authRequired: true,
		validateParams: isAddPermissionProps,
	},
	{
		post() {
			const { permissionId, roleId } = this.bodyParams;

			Meteor.call('authorization:addPermissionToRole', permissionId, roleId);

			return API.v1.success();
		},
	},
);
