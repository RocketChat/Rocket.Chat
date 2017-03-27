Meteor.methods({
	sendMessageLivechat(message) {
		check(message.rid, String);
		check(message.token, String);

		const guest = Meteor.users.findOne(Meteor.userId(), {
			fields: {
				name: 1,
				username: 1,
				department: 1
			}
		});

		return RocketChat.Livechat.sendMessage({ guest, message });
	}
});
