Meteor.startup(function() {
	RocketChat.Notifications.onLogged('Users:Deleted', ({ userId }) =>
		ChatMessage.remove({
			'u._id': userId
		})
	);
});
