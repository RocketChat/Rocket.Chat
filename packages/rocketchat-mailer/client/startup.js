RocketChat.AdminBox.addOption({
	href: 'mailer',
	i18nLabel: 'Mailer',
	icon: 'mail',
	permissionGranted() {
		return RocketChat.authz.hasAllPermission('access-mailer');
	}
});
