/* globals ChatPermissions */
import {permissionLevel} from '../../lib/rocketchat';

const whereNotSetting = {
	$where: function() {
		return this.level !== permissionLevel.SETTING;
	}.toString()
};

Template.permissions.helpers({
	roles() {
		return Template.instance().roles.get();
	},

	permissions() {
		return ChatPermissions.find(whereNotSetting, //the $where seems to have no effect - filtered as workaround after fetch()
			{
				sort: {
					_id: 1
				}
			}).fetch()
			.filter((setting) => !setting.level);
	},

	settingPermissions() {
		return ChatPermissions.find({
			level: permissionLevel.SETTING
		},
		{
			sort: { //sorting seems not to be copied from the publication, we need to request it explicitly in find()
				group: 1,
				section: 1
			}
		}).fetch()
			.filter((setting) => setting.group); //group permissions are assigned implicitly,  we can hide them. $exists: {group:false} not supported by Minimongo
	},

	hasPermission() {
		return RocketChat.authz.hasAllPermission('access-permissions');
	},

	hasSettingPermission() {
		return RocketChat.authz.hasAllPermission('access-setting-permissions');
	},

	settingPermissionExpanded() {
		return Template.instance().settingPermissionsExpanded.get();
	}
});

Template.permissions.events({
	'click .js-toggle-setting-permissions'(event, instance) {
		instance.settingPermissionsExpanded.set(!instance.settingPermissionsExpanded.get());
	}
});

Template.permissions.onCreated(function() {
	this.settingPermissionsExpanded = new ReactiveVar(false);
	this.roles = new ReactiveVar([]);

	Tracker.autorun(() => {
		this.roles.set(RocketChat.models.Roles.find().fetch());
	});
});

Template.permissionsTable.helpers({
	granted(roles, role) {
		if (roles) {
			if (roles.indexOf(role._id) !== -1) {
				return 'checked';
			}
		}
	},

	permissionName(permission) {
		if (permission.level === permissionLevel.SETTING) {
			let path = '';
			if (permission.group) {
				path = `${ t(permission.group) } > `;
			}
			if (permission.section) {
				path = `${ path }${ t(permission.section) } > `;
			}
			path = `${ path }${ t(permission.settingId) }`;
			return path;
		} else {
			return t(permission._id);
		}
	},

	permissionDescription(permission) {
		return t(`${ permission._id }_description`);
	}
});

Template.permissionsTable.events({
	'click .role-permission'(e, instance) {
		const permission = e.currentTarget.getAttribute('data-permission');
		const role = e.currentTarget.getAttribute('data-role');

		if (!instance.permissionByRole[permission] // the permissino has this role not assigned at all (undefined)
			|| instance.permissionByRole[permission].indexOf(role) === -1) {
			return Meteor.call('authorization:addPermissionToRole', permission, role);
		} else {
			return Meteor.call('authorization:removeRoleFromPermission', permission, role);
		}
	}
});

Template.permissionsTable.onCreated(function() {
	this.permissionByRole = {};
	this.actions = {
		added: {},
		removed: {}
	};

	Tracker.autorun(() => {
		const observer = {
			added: (id, fields) => {
				this.permissionByRole[id] = fields.roles;
			},
			changed: (id, fields) => {
				this.permissionByRole[id] = fields.roles;
			},
			removed: (id) => {
				delete this.permissionByRole[id];
			}
		};
		if (this.data.collection === 'Chat') {
			ChatPermissions.find(whereNotSetting).observeChanges(observer);
		}

		if (this.data.collection === 'Setting') {
			ChatPermissions.find({level: permissionLevel.SETTING}).observeChanges(observer);
		}
	});
});

