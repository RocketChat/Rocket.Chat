Meteor.subscribe('roles');

RocketChat.AdminBox.addOption({
	href: 'admin-permissions',
	i18nLabel: 'Permissions',
	permissionGranted: function() {
		return RocketChat.authz.hasAllPermission('access-permissions');
	}
});
