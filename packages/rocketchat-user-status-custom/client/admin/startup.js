RocketChat.AdminBox.addOption({
  href: 'user-status-custom',
  i18nLabel: 'Custom_User_Status',
  icon: 'user',
  permissionGranted() {
    return RocketChat.authz.hasAtLeastOnePermission(['manage-user-status']);
  }
});
