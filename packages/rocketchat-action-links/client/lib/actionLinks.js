//Action Links Handler. This method will be called off the client.

RocketChat.actionLinks.run = (name, messageId, instance) => {
	var message = RocketChat.actionLinks.getMessage(name, messageId);

	var actionLink = message.actionLinks[name];

	var ranClient = false;

	if (RocketChat.actionLinks && RocketChat.actionLinks.actions && RocketChat.actionLinks.actions[actionLink.method_id]) {
		// run just on client side
		RocketChat.actionLinks.actions[actionLink.method_id](message, actionLink.params, instance);

		ranClient = true;
	}

	// and run on server side
	Meteor.call('actionLinkHandler', name, messageId, (err) => {
		if (err && !ranClient) {
			handleError(err);
		}
	});
};
