Meteor.methods({
	sendMessageLivechat: function(message) {
		var guest;

		check(message.rid, String);
		check(message.token, String);

		guest = Meteor.users.findOne(Meteor.userId(), {
			fields: {
				name: 1,
				username: 1,
				department: 1
			}
		});

		return RocketChat.Livechat.sendMessage({ guest: guest, message: message });
	}
});
