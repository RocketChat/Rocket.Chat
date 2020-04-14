/* eslint no-multi-spaces: 0 */
import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../license/server';
import { Permissions, Roles } from '../../../../app/models/server';

onLicense('auditing', () => {
	require('./methods');

	Meteor.startup(function() {
		const permissions = [
			{ _id: 'can-audit', roles: ['admin', 'auditor'] },
			{ _id: 'can-audit-log', roles: ['admin', 'auditor-log'] },
		];

		const defaultRoles = [
			{ name: 'auditor', scope: 'Users' },
			{ name: 'auditor-log', scope: 'Users' },
		];

		permissions.forEach((permission) => {
			if (!Permissions.findOneById(permission._id)) {
				Permissions.upsert(permission._id, { $set: permission });
			}
		});

		defaultRoles.forEach((role) =>
			Roles.upsert({ _id: role.name }, { $setOnInsert: { scope: role.scope, description: role.description || '', protected: true } }),
		);
	});
});
