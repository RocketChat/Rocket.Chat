Meteor.methods({
	sendMessageLivechat(message, agent) {
		check(message.rid, String);
		check(message.token, String);

		const guest = Meteor.users.findOne(Meteor.userId(), {
			fields: {
				name: 1,
				username: 1,
				department: 1
			}
		});

		if (agent && agent.username) {
			const onlineAgents = RocketChat.models.Users.findOnlineUserFromList(agent.username);

			if (onlineAgents.count() === 0) {
				agent = null;
			} else {
				agent = {
					agentId: agent._id,
					username: agent.username
				};
			}
		}

		return RocketChat.Livechat.sendMessage({ guest, message, agent });
	}
});
