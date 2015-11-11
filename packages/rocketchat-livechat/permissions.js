Meteor.startup(function() {
	var i, j, len, len1, permission, ref, role, roles,
		indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	var permissions = [
		{
			_id: 'receive-livechat',
			roles : ['livechat-agent']
		},
		{
			_id: 'edit-livechat-settings',
			roles : ['livechat-manager']
		}
	];

	roles = _.pluck(Roles.getAllRoles().fetch(), 'name');

	for (i = 0, len = permissions.length; i < len; i++) {
		permission = permissions[i];
		RocketChat.models.Permissions.upsert(permission._id, {
			$setOnInsert: permission
		});
		ref = permission.roles;
		for (j = 0, len1 = ref.length; j < len1; j++) {
			role = ref[j];
			if (indexOf.call(roles, role) < 0) {
				Roles.createRole(role);
				roles.push(role);
			}
		}
	}
});
