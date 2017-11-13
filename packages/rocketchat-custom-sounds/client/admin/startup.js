RocketChat.AdminBox.addOption({
	href: 'custom-sounds',
	i18nLabel: 'Custom_Sounds',
	icon: 'volume',
	permissionGranted() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-sounds']);
	}
});
