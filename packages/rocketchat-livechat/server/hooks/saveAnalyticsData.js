RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (!message || message.editedAt) {
		return message;
	}

	// check if room is livechat & yet awaiting for response
	if (!(typeof room.t !== 'undefined' && room.t === 'l')) {
		return message;
	}

	// if the message has a token, it was sent by the visitor, so ignore it
	if (message.token) {
		return message;
	}

	Meteor.defer(() => {
		const now = new Date();
		const analyticsData = {};
		const visitorLastMessage = (room.metrics && room.metrics.v) ? room.metrics.v.lq : room.ts;
		const agentLastMessage = (room.metrics && room.metrics.servedBy) ? room.metrics.servedBy.lr : room.ts;
		const agentJoinTime = (room.servedBy && room.servedBy.ts) ? room.servedBy.ts : room.ts;

		if (agentLastMessage === room.ts) {		// first response
			analyticsData.firstResponseDate = now;
			analyticsData.firstResponseTime = (now.getTime() - visitorLastMessage) / 1000;
			analyticsData.responseTime = (now.getTime() - visitorLastMessage) / 1000;
			analyticsData.avgResponseTime = (((room.metrics && room.metrics.response && room.metrics.response.tt) ? room.metrics.response.tt : 0) + analyticsData.responseTime) / (((room.metrics && room.metrics.response && room.metrics.response.total) ? room.metrics.response.total : 0) + 1);

			analyticsData.firstReactionDate = now;
			analyticsData.firstReactionTime = (now.getTime() - agentJoinTime) / 1000;
			analyticsData.reactionTime = (now.getTime() - agentJoinTime) / 1000;
		} else if (visitorLastMessage > agentLastMessage) {		// response, not first
			analyticsData.responseTime = (now.getTime() - visitorLastMessage) / 1000;
			analyticsData.avgResponseTime = (((room.metrics && room.metrics.response && room.metrics.response.tt) ? room.metrics.response.tt : 0) + analyticsData.responseTime) / (((room.metrics && room.metrics.response && room.metrics.response.total) ? room.metrics.response.total : 0) + 1);

			analyticsData.reactionTime = (now.getTime() - visitorLastMessage) / 1000;
		} else {
			return;		// ignore, its continuing response
		}

		RocketChat.models.Rooms.saveAnalyticsDataByRoomId(room._id, 1, analyticsData);
	});

	return message;
}, RocketChat.callbacks.priority.MEDIUM, 'saveAnalyticsData');
