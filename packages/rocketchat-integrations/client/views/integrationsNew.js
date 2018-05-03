Template.integrationsNew.helpers({
	hasPermission() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	}
});
