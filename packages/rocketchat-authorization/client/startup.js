Meteor.subscribe('roles');

RocketChat.AdminBox.addOption({
	href: 'admin-permissions',
	i18nLabel: 'Permissions',
	icon: 'lock',
	permissionGranted() {
		return RocketChat.authz.hasAllPermission('access-permissions');
	}
});
