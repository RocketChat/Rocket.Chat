/* globals ChatPermissions, SettingPermissions */
Template.permissions.helpers({
	roles() {
		return Template.instance().roles.get();
	},

	permissions() {
		return ChatPermissions.find({}, {
			sort: {
				_id: 1
			}
		});
	},

	settingPermissions() {
		return SettingPermissions.find({}, {
			sort: {
				_id: 1
			}
		});
	},

	hasPermission() {
		return RocketChat.authz.hasAllPermission('access-permissions');
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
		return t(permission._id);
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
		ChatPermissions.find().observeChanges(observer);
		SettingPermissions.find().observeChanges(observer);
	});
});
