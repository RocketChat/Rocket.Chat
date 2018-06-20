/* globals fireGlobalEvent */

/* fire user state change globally, to listen on desktop electron client */ 
Meteor.startup(function() {
	RocketChat.callbacks.add('userStatusManuallySet', (status) => {
		fireGlobalEvent('userStatusManuallySet', status);
	});
});
