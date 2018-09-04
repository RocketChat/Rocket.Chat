RocketChat.CachedCollectionManager.onLogin(() => {
	Meteor.subscribe('roles');
});

RocketChat.AdminBox.addOption({
	href: 'admin-permissions',
	i18nLabel: 'Permissions',
	icon: 'lock',
	permissionGranted() {
		return RocketChat.authz.hasAtLeastOnePermission(['access-permissions', 'access-setting-permissions']);
	}
});
