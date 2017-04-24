//Action Links Handler. This method will be called off the client.

Meteor.methods({
	actionLinkHandler(name, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'actionLinkHandler' });
		}

		const message = RocketChat.actionLinks.getMessage(name, messageId);

		const actionLink = message.actionLinks[name];

		RocketChat.actionLinks.actions[actionLink.method_id](message, actionLink.params);
	}
});
