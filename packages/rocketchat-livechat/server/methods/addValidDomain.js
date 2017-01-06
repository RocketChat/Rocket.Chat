Meteor.methods({
	'livechat:addValidDomain'(domain) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeValidDomain' });
		}

		return RocketChat.Livechat.addValidDomain(domain);
	}
});
