const commandStream = new Meteor.Streamer('client-commands');
this.commandStream = commandStream;

commandStream.allowWrite('none');

commandStream.allowRead('all');

/**
 * Overriding function that is called on the onStop() event of the stream
 * Anytime the account unsubscribes from the CC stream, we reset its data
 * because it might connect with another client and if this new client
 * does not set a new customClientData, the currrent data will be outdated
 */
const oldRemoveSubscription = commandStream.removeSubscription;
commandStream.removeSubscription = function(subscription, eventName) {
	RocketChat.resetCustomClientData(eventName);
	oldRemoveSubscription.apply(this, arguments);
};
