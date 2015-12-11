Meteor.publish('livechat:trigger', function() {
	if (!this.userId) {
		throw new Meteor.Error('not-authorized');
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		throw new Meteor.Error('not-authorized');
	}

	console.log('[publish] livechat:trigger -> '.green, 'arguments:', arguments);

	return RocketChat.models.LivechatTrigger.find();
});
