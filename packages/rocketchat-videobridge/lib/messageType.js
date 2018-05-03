Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'jitsi_call_started',
		system: true,
		message: TAPi18n.__('Started_a_video_call')
	});
});
