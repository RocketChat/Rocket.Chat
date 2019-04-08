import { Meteor } from 'meteor/meteor';

/**
 * Makes the knowledge base panel open on opening a room in which it is active
 * (a request, an expertise or a livechat)
 */
RocketChat.callbacks.add('enter-room', function(subscription) {
	if (Meteor.isCordova) {
		return; // looks awkward on mobile if panel is opened by default
	}

	if (subscription && subscription.t === 'l') { // no subscription: if a user joins a room without being subscribed to it
		if ($('.messages-container-wrapper .contextual-bar').length === 0) { // the tab bar is closed
			Meteor.setTimeout(() => $('div:not(.active) .rc-header .rc-room-actions .rc-room-actions__action[data-id="assistify-ai"] > button').click(), 1000);
		}
	}
});
