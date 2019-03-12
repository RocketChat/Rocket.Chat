import { Meteor } from 'meteor/meteor';
import { handleError } from '/app/utils';
import { actionLinks } from '../../both/lib/actionLinks';
// Action Links Handler. This method will be called off the client.

actionLinks.run = (name, messageId, instance) => {
	const message = actionLinks.getMessage(name, messageId);

	const actionLink = message.actionLinks[name];

	let ranClient = false;

	if (actionLinks && actionLinks.actions && actionLinks.actions[actionLink.method_id]) {
		// run just on client side
		actionLinks.actions[actionLink.method_id](message, actionLink.params, instance);

		ranClient = true;
	}

	// and run on server side
	Meteor.call('actionLinkHandler', name, messageId, (err) => {
		if (err && !ranClient) {
			handleError(err);
		}
	});
};
