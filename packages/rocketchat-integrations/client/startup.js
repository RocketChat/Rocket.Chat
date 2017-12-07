RocketChat.AdminBox.addOption({
	href: 'admin-integrations',
	i18nLabel: 'Integrations',
	icon: 'code',
	permissionGranted: () => RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations'])
});
