const requestStream = new Meteor.Streamer('ddp-requests');
this.requestStream = requestStream;

requestStream.allowWrite('none');

requestStream.allowRead('all');

/**
 * Overriding function that is called on the onStop() event of the stream
 * Anytime the account unsubscribes from the CC stream, we reset its data
 * because it might connect with another client and if this new client
 * does not set a new customClientData, the currrent data will be outdated
 */
const oldRemoveSubscription = requestStream.removeSubscription;
requestStream.removeSubscription = function(subscription, eventName) {
	const userId = eventName;
	RocketChat.resetCustomClientData(userId);
	oldRemoveSubscription.apply(this, subscription, eventName);
};
