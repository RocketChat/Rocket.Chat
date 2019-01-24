import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import _ from 'underscore';

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function(_id, surveyFeedback) {
	const query = {
		_id,
	};

	const update = {
		$set: {
			surveyFeedback,
		},
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function(token, key, value, overwrite = true) {
	const query = {
		'v.token': token,
		open: true,
	};

	if (!overwrite) {
		const room = this.findOne(query, { fields: { livechatData: 1 } });
		if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
			return true;
		}
	}

	const update = {
		$set: {
			[`livechatData.${ key }`]: value,
		},
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.findLivechat = function(filter = {}, offset = 0, limit = 20) {
	const query = _.extend(filter, {
		t: 'l',
	});

	return this.find(query, { sort: { ts: - 1 }, offset, limit });
};

RocketChat.models.Rooms.findLivechatById = function(_id, fields) {
	const options = {};

	if (fields) {
		options.fields = fields;
	}

	const query = {
		t: 'l',
		_id,
	};

	return this.find(query, options);
};

RocketChat.models.Rooms.findLivechatByIdAndVisitorToken = function(_id, visitorToken, fields) {
	const options = {};

	if (fields) {
		options.fields = fields;
	}

	const query = {
		t: 'l',
		_id,
		'v.token': visitorToken,
	};

	return this.findOne(query, options);
};

RocketChat.models.Rooms.findLivechatByVisitorToken = function(visitorToken, fields) {
	const options = {};

	if (fields) {
		options.fields = fields;
	}

	const query = {
		t: 'l',
		'v.token': visitorToken,
	};

	return this.findOne(query, options);
};

/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */
RocketChat.models.Rooms.updateLivechatRoomCount = function() {
	const settingsRaw = RocketChat.models.Settings.model.rawCollection();
	const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

	const query = {
		_id: 'Livechat_Room_Count',
	};

	const update = {
		$inc: {
			value: 1,
		},
	};

	const livechatCount = findAndModify(query, null, update);

	return livechatCount.value.value;
};

RocketChat.models.Rooms.findOpenByVisitorToken = function(visitorToken, options) {
	const query = {
		open: true,
		'v.token': visitorToken,
	};

	return this.find(query, options);
};

RocketChat.models.Rooms.findOpenByVisitorTokenAndDepartmentId = function(visitorToken, departmentId, options) {
	const query = {
		open: true,
		'v.token': visitorToken,
		departmentId,
	};

	return this.find(query, options);
};

RocketChat.models.Rooms.findByVisitorToken = function(visitorToken) {
	const query = {
		'v.token': visitorToken,
	};

	return this.find(query);
};

RocketChat.models.Rooms.findByVisitorId = function(visitorId) {
	const query = {
		'v._id': visitorId,
	};

	return this.find(query);
};

RocketChat.models.Rooms.findOneOpenByRoomIdAndVisitorToken = function(roomId, visitorToken, options) {
	const query = {
		_id: roomId,
		open: true,
		'v.token': visitorToken,
	};

	return this.findOne(query, options);
};

RocketChat.models.Rooms.setResponseByRoomId = function(roomId, response) {
	return this.update({
		_id: roomId,
	}, {
		$set: {
			responseBy: {
				_id: response.user._id,
				username: response.user.username,
			},
		},
		$unset: {
			waitingResponse: 1,
		},
	});
};

RocketChat.models.Rooms.saveAnalyticsDataByRoomId = function(room, message, analyticsData) {
	const update = {
		$set: {},
	};

	if (analyticsData) {
		update.$set['metrics.response.avg'] = analyticsData.avgResponseTime;

		update.$inc = {};
		update.$inc['metrics.response.total'] = 1;
		update.$inc['metrics.response.tt'] = analyticsData.responseTime;
		update.$inc['metrics.reaction.tt'] = analyticsData.reactionTime;
	}

	if (analyticsData && analyticsData.firstResponseTime) {
		update.$set['metrics.response.fd'] = analyticsData.firstResponseDate;
		update.$set['metrics.response.ft'] = analyticsData.firstResponseTime;
		update.$set['metrics.reaction.fd'] = analyticsData.firstReactionDate;
		update.$set['metrics.reaction.ft'] = analyticsData.firstReactionTime;
	}

	// livechat analytics : update last message timestamps
	const visitorLastQuery = (room.metrics && room.metrics.v) ? room.metrics.v.lq : room.ts;
	const agentLastReply = (room.metrics && room.metrics.servedBy) ? room.metrics.servedBy.lr : room.ts;

	if (message.token) {	// update visitor timestamp, only if its new inquiry and not continuing message
		if (agentLastReply >= visitorLastQuery) {		// if first query, not continuing query from visitor
			update.$set['metrics.v.lq'] = message.ts;
		}
	} else if (visitorLastQuery > agentLastReply) {		// update agent timestamp, if first response, not continuing
		update.$set['metrics.servedBy.lr'] = message.ts;
	}

	return this.update({
		_id: room._id,
	}, update);
};

/**
 * total no of conversations between date.
 * @param {string, {ISODate, ISODate}} t - string, room type. date.gte - ISODate (ts >= date.gte), date.lt- ISODate (ts < date.lt)
 * @return {int}
 */

RocketChat.models.Rooms.getTotalConversationsBetweenDate = function(t, date) {
	const query = {
		t,
		ts: {
			$gte: new Date(date.gte),	// ISO Date, ts >= date.gte
			$lt: new Date(date.lt),	// ISODate, ts < date.lt
		},
	};

	return this.find(query).count();
};

RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate = function(t, date) {
	const query = {
		t,
		ts: {
			$gte: new Date(date.gte),	// ISO Date, ts >= date.gte
			$lt: new Date(date.lt),	// ISODate, ts < date.lt
		},
	};

	return this.find(query, { fields: { ts: 1, departmentId: 1, open: 1, servedBy: 1, metrics: 1, msgs: 1 } });
};

RocketChat.models.Rooms.closeByRoomId = function(roomId, closeInfo) {
	return this.update({
		_id: roomId,
	}, {
		$set: {
			closer: closeInfo.closer,
			closedBy: closeInfo.closedBy,
			closedAt: closeInfo.closedAt,
			'metrics.chatDuration': closeInfo.chatDuration,
			'v.status': 'offline',
		},
		$unset: {
			open: 1,
		},
	});
};

RocketChat.models.Rooms.findOpenByAgent = function(userId) {
	const query = {
		open: true,
		'servedBy._id': userId,
	};

	return this.find(query);
};

RocketChat.models.Rooms.changeAgentByRoomId = function(roomId, newAgent) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			servedBy: {
				_id: newAgent.agentId,
				username: newAgent.username,
				ts: new Date(),
			},
		},
	};

	if (newAgent.ts) {
		update.$set.servedBy.ts = newAgent.ts;
	}

	this.update(query, update);
};

RocketChat.models.Rooms.changeDepartmentIdByRoomId = function(roomId, departmentId) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			departmentId,
		},
	};

	this.update(query, update);
};

RocketChat.models.Rooms.saveCRMDataByRoomId = function(roomId, crmData) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			crmData,
		},
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.updateVisitorStatus = function(token, status) {
	const query = {
		'v.token': token,
		open: true,
	};

	const update = {
		$set: {
			'v.status': status,
		},
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.removeAgentByRoomId = function(roomId) {
	const query = {
		_id: roomId,
	};
	const update = {
		$unset: {
			servedBy: 1,
		},
	};

	this.update(query, update);
};

RocketChat.models.Rooms.removeByVisitorToken = function(token) {
	const query = {
		'v.token': token,
	};

	this.remove(query);
};
