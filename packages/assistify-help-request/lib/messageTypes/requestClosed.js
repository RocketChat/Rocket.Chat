/* globals RocketChat */

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'request_closed',
		system: true,
		message: 'Request_closed',
		data(message) {
			return {
				user_by: message.u.username,
				comment: message.msg
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'request_closed_explanation',
		system: true,
		message: 'Request_closed_explanation',
		data(message) {
			return {
				user_by: message.u.username
			};
		}
	});
});
