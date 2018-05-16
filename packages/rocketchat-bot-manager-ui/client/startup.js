RocketChat.AdminBox.addOption({
	href: 'admin-bots',
	i18nLabel: 'Bots',
	icon: 'code',
	permissionGranted: () => RocketChat.authz.hasAtLeastOnePermission(['view-bot-administration'])
});
