import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { ChatPermissions } from '../lib/ChatPermissions';
import { t } from '../../../utils/client';
import { CONSTANTS, AuthorizationUtils } from '../../lib';

Template.permissionsTable.helpers({
	granted(roles, role) {
		return (roles && ~roles.indexOf(role._id) && 'checked') || null;
	},

	permissionName(permission) {
		if (permission.level === CONSTANTS.SETTINGS_LEVEL) {
			let path = '';
			if (permission.group) {
				path = `${ t(permission.group) } > `;
			}
			if (permission.section) {
				path = `${ path }${ t(permission.section) } > `;
			}
			return `${ path }${ t(permission.settingId) }`;
		}

		return t(permission._id);
	},

	permissionDescription(permission) {
		return t(`${ permission._id }_description`);
	},

	disabled(role) {
		return AuthorizationUtils.isRoleReadOnly(role._id);
	},
});

Template.permissionsTable.events({
	'click .role-permission'(e) {
		const permissionId = e.currentTarget.getAttribute('data-permission');
		const role = e.currentTarget.getAttribute('data-role');

		const permission = permissionId && ChatPermissions.findOne(permissionId);

		const action = ~permission.roles.indexOf(role) ? 'authorization:removeRoleFromPermission' : 'authorization:addPermissionToRole';

		return Meteor.call(action, permissionId, role);
	},
});
