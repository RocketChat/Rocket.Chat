RocketChat.AdminBox.addOption({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	permissionGranted() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-sounds']);
	}
});
