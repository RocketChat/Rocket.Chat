RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (!message || message.editedAt) {
		return message;
	}

	// check if room is livechat & yet awaiting for response
	if (!(typeof room.t !== 'undefined' && room.t === 'l')) {
		return message;
	}

	RocketChat.models.Rooms.setLastMessageTimeById(room, message);

	// if the message has a token, it was sent by the visitor, so ignore it
	if (message.token) {
		return message;
	}

	Meteor.defer(() => {
		const now = new Date();
		const analyticsData = {};
		const visitorLastQuery = (room.metrics && room.metrics.v) ? room.metrics.v.lq : room.ts;
		const agentLastReply = (room.metrics && room.metrics.servedBy) ? room.metrics.servedBy.lr : room.ts;
		const agentJoinTime = (room.servedBy && room.servedBy.ts) ? room.servedBy.ts : room.ts;

		if (agentLastReply === room.ts) {		// first response
			analyticsData.firstResponseDate = now;
			analyticsData.firstResponseTime = (now.getTime() - visitorLastQuery) / 1000;
			analyticsData.responseTime = (now.getTime() - visitorLastQuery) / 1000;
			analyticsData.avgResponseTime = (((room.metrics && room.metrics.response && room.metrics.response.tt) ? room.metrics.response.tt : 0) + analyticsData.responseTime) / (((room.metrics && room.metrics.response && room.metrics.response.total) ? room.metrics.response.total : 0) + 1);

			analyticsData.firstReactionDate = now;
			analyticsData.firstReactionTime = (now.getTime() - agentJoinTime) / 1000;
			analyticsData.reactionTime = (now.getTime() - agentJoinTime) / 1000;
		} else if (visitorLastQuery > agentLastReply) {		// response, not first
			analyticsData.responseTime = (now.getTime() - visitorLastQuery) / 1000;
			analyticsData.avgResponseTime = (((room.metrics && room.metrics.response && room.metrics.response.tt) ? room.metrics.response.tt : 0) + analyticsData.responseTime) / (((room.metrics && room.metrics.response && room.metrics.response.total) ? room.metrics.response.total : 0) + 1);

			analyticsData.reactionTime = (now.getTime() - visitorLastQuery) / 1000;
		} else {
			return;		// ignore, its continuing response
		}

		RocketChat.models.Rooms.saveAnalyticsDataByRoomId(room._id, 1, analyticsData);
	});

	return message;
}, RocketChat.callbacks.priority.LOW, 'saveAnalyticsData');
