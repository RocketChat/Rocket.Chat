class LivechatInquiry extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('livechat_inquiry');

		this.tryEnsureIndex({ 'rid': 1 }); // room id corresponding to this inquiry 
		this.tryEnsureIndex({ 'name': 1 }); // name of the inquiry (client name for now)
		this.tryEnsureIndex({ 'message': 1 }); // message sent by the client 
		this.tryEnsureIndex({ 'ts': 1 }); // timestamp
		this.tryEnsureIndex({ 'code': 1 }); // (for routing)
		this.tryEnsureIndex({ 'agents': 1}); // Id's of the agents who can see the inquiry (handle departments)
		this.tryEnsureIndex({ 'status': 1}); // 'open', 'taken'
	}

	/*
	 * User with uid takes the inquiry
	 * subsribe user to room, remove inquiry from collection 
	 */
	takeInquiry(inquiry, agent) {

		// add subscription
		var subscriptionData = {
			rid: inquiry.rid,
			name: inquiry.name,
			alert: true,
			open: true,
			unread: 1,
			code: inquiry.code,
			u: {
				_id: agent._id,
				username: agent.username
			},
			t: 'l',
			desktopNotifications: 'all',
			mobilePushNotifications: 'all',
			emailNotifications: 'all',
			answered: 'false',
			// assignment: 'view'
		};
		RocketChat.models.Subscriptions.insert(subscriptionData);

		// add user to room 
		RocketChat.models.Rooms.addUsernameById(inquiry.rid, agent.username);

		// TODO: mark inquiry as taken 
		this.update({},{ 
			$set: { status: 'taken' } 
		});

		// add status field 
		// this.remove({_id: inquiry._id});	

	}

	returnAsInquiry(roomId, agentId) {
		// find out corresponding inquiry from room, 

		//get agent username 

		// remove agent subscription 
		RocketChat.models.Subscriptions.removeByRoomIdAndUserId(roomId, agentId);

		// remove agent username from room 
		RocketChat.models.Rooms.removeUsernameById(roomId, username);

		// mark inquiry as open 
		this.update({},{ 
			$set: { status: 'open' } 
		});
	}
}

RocketChat.models.LivechatInquiry = new LivechatInquiry();