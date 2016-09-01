RocketChat.AdminBox.addOption({
	href: 'custom-emoji',
	i18nLabel: 'Custom_Emoji',
	permissionGranted() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-assets']);
	}
});
