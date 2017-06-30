RocketChat.AdminBox.addOption({
	href: 'emoji-custom',
	i18nLabel: 'Custom_Emoji',
	permissionGranted() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-emoji']);
	}
});
