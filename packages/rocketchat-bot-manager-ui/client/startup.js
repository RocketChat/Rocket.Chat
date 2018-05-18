RocketChat.AdminBox.addOption({
	href: 'admin-bots',
	i18nLabel: 'Bots',
	icon: 'hubot',
	permissionGranted: () => RocketChat.authz.hasAtLeastOnePermission(['view-bot-administration'])
});
