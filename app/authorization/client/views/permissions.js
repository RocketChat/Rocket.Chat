import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { Roles } from '../../../models';
import { ChatPermissions } from '../lib/ChatPermissions';
import { hasAllPermission } from '../hasPermission';

import { hasAtLeastOnePermission } from '..';

import { t } from '../../../utils/client';
import { SideNav } from '../../../ui-utils/client/lib/SideNav';

const whereNotSetting = {
	level: { $ne: 'setting' },
};

Template.permissions.helpers({
	roles() {
		return Roles.find();
	},

	permissions() {
		return ChatPermissions.find(whereNotSetting, // the $where seems to have no effect - filtered as workaround after fetch()
			{
				sort: {
					_id: 1,
				},
			});
	},

	settingPermissions() {
		return ChatPermissions.find({
			level: 'setting',
			group: { $exists: true },
		},
		{
			sort: { // sorting seems not to be copied from the publication, we need to request it explicitly in find()
				group: 1,
				section: 1,
			},
		}); // group permissions are assigned implicitly,  we can hide them. $exists: {group:false} not supported by Minimongo
	},

	hasPermission() {
		return hasAllPermission('access-permissions');
	},

	hasSettingPermission() {
		return hasAllPermission('access-setting-permissions');
	},

	hasNoPermission() {
		return !hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']);
	},

	settingPermissionsToggled() {
		return Template.instance().settingPermissionsToggled.get();
	},
});

Template.permissions.events({
	'click .js-toggle-setting-permissions'(event, instance) {
		instance.settingPermissionsToggled.set(!instance.settingPermissionsToggled.get());
	},
});

Template.permissions.onCreated(function() {
	this.settingPermissionsToggled = new ReactiveVar(false);
});

Template.permissionsTable.helpers({
	granted(roles, role) {
		return (roles && ~roles.indexOf(role._id) && 'checked') || null;
	},

	permissionName(permission) {
		if (permission.level === 'setting') {
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
});

Template.permissionsTable.events({
	'click .role-permission'(e) {
		const permissionId = e.currentTarget.getAttribute('data-permission');
		const role = e.currentTarget.getAttribute('data-role');

		const permission = permissionId && ChatPermissions.findOne(permissionId);

		const action = ~permission.roles.indexOf(role) ? 'authorization:removeRoleFromPermission' : 'authorization:addPermissionToRole';

		return Meteor.call(action, permission, role);
	},
});

Template.permissions.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
