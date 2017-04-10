function data(message) {
	return {
		user_by: message.u && message.u.username,
		room_type: message.msg
	};
}
Meteor.startup(function() {
	['room_changed_privacy', 'room_changed_topic', 'room_changed_announcement', 'room_changed_description'].forEach(id => {
		RocketChat.MessageTypes.registerType({
			id,
			system: true,
			message: id,
			data
		});
	});
});
