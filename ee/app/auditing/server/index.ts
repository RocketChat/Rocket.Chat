/* eslint no-multi-spaces: 0 */
import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../license/server';
import { Permissions, Roles } from '../../../../app/models/server/raw';

onLicense('auditing', () => {
	require('./methods');

	Meteor.startup(function () {
		const permissions = [
			{ _id: 'can-audit', roles: ['admin', 'auditor'] },
			{ _id: 'can-audit-log', roles: ['admin', 'auditor-log'] },
		];

		const defaultRoles = [
			{ name: 'auditor', scope: 'Users' as const },
			{ name: 'auditor-log', scope: 'Users' as const },
		];

		permissions.forEach((permission) => {
			Permissions.create(permission._id, permission.roles);
		});

		defaultRoles.forEach((role) => Roles.createOrUpdate(role.name, role.scope));
	});
});
