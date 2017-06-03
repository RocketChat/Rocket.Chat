RocketChat.leave_automatic_channel = function(room_name) {
	const is_channel_automatic = Meteor.users.find({
		'automatic_channels.name':room_name
	}).count();
	if (is_channel_automatic>0) {
		Meteor.users.update({
			_id: Meteor.userId(),
			'automatic_channels.name': room_name
		}, {
			$set: {
				'automatic_channels.$.blacklisted' : 'true'
			}
		});
	} else {
		return;
	}
};

