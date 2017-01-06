Meteor.methods({
	'livechat:removeValidDomain'(_id) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeValidDomain' });
		}

		return RocketChat.Livechat.removeValidDomain(_id);
	}
});
