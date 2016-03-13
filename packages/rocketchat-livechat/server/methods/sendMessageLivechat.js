Meteor.methods({
	sendMessageLivechat: function(message) {
		var guest, agent, room;

		check(message.rid, String);
		check(message.token, String);

		guest = Meteor.users.findOne(Meteor.userId(), {
			fields: {
				username: 1,
				department: 1
			}
		});

		room = RocketChat.models.Rooms.findOneById(message.rid);
		if (room == null) {

			// if no department selected verify if there is only one active and use it
			if (!guest.department) {
				var departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
				if (departments.count() === 1) {
					guest.department = departments.fetch()[0]._id;
				}
			}

			agent = getNextAgent(guest.department);
			if (!agent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}
			RocketChat.models.Rooms.insert({
				_id: message.rid,
				name: guest.username,
				msgs: 1,
				lm: new Date(),
				usernames: [agent.username, guest.username],
				t: 'l',
				ts: new Date(),
				v: {
					token: message.token
				}
			});
			RocketChat.models.Subscriptions.insert({
				rid: message.rid,
				name: guest.username,
				alert: true,
				open: true,
				unread: 1,
				answered: false,
				u: {
					_id: agent.agentId,
					username: agent.username
				},
				t: 'l'
			});
		}
		room = Meteor.call('canAccessRoom', message.rid, guest._id);
		if (!room) {
			throw new Meteor.Error('cannot-acess-room');
		}
		return RocketChat.sendMessage(guest, message, room);
	}
});
