RocketChat.leave_automatic_channel = function(room_name) {
	Meteor.users.update({
		_id: Meteor.userId(),
		'automatic_channels.name': room_name
	}, {
		$set: {
			'automatic_channels.$.blacklisted' : 'true'
		}
	});
};

