import _ from 'underscore';

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function(_id, surveyFeedback) {
	const query = {
		_id
	};

	const update = {
		$set: {
			surveyFeedback
		}
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function(token, key, value, overwrite = true) {
	const query = {
		'v.token': token,
		open: true
	};

	if (!overwrite) {
		const room = this.findOne(query, { fields: { livechatData: 1 } });
		if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
			return true;
		}
	}

	const update = {
		$set: {
			[`livechatData.${ key }`]: value
		}
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.findLivechat = function(filter = {}, offset = 0, limit = 20) {
	const query = _.extend(filter, {
		t: 'l'
	});

	return this.find(query, { sort: { ts: - 1 }, offset, limit });
};

RocketChat.models.Rooms.findLivechatByCode = function(code, fields) {
	code = parseInt(code);

	const options = {};

	if (fields) {
		options.fields = fields;
	}

	// if (this.useCache) {
	// 	return this.cache.findByIndex('t,code', ['l', code], options).fetch();
	// }

	const query = {
		t: 'l',
		code
	};

	return this.findOne(query, options);
};

RocketChat.models.Rooms.findLivechatById = function(_id, fields) {
	const options = {};

	if (fields) {
		options.fields = fields;
	}

	const query = {
		t: 'l',
		_id
	};

	return this.findOne(query, options);
};

/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */
RocketChat.models.Rooms.getNextLivechatRoomCode = function() {
	const settingsRaw = RocketChat.models.Settings.model.rawCollection();
	const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

	const query = {
		_id: 'Livechat_Room_Count'
	};

	const update = {
		$inc: {
			value: 1
		}
	};

	const livechatCount = findAndModify(query, null, update);

	return livechatCount.value.value;
};

RocketChat.models.Rooms.findOpenByVisitorToken = function(visitorToken, options) {
	const query = {
		open: true,
		'v.token': visitorToken
	};

	return this.find(query, options);
};

RocketChat.models.Rooms.findByVisitorToken = function(visitorToken) {
	const query = {
		'v.token': visitorToken
	};

	return this.find(query);
};

RocketChat.models.Rooms.findByVisitorId = function(visitorId) {
	const query = {
		'v._id': visitorId
	};

	return this.find(query);
};

RocketChat.models.Rooms.findOneOpenByVisitorToken = function(token, roomId) {
	const query = {
		_id: roomId,
		open: true,
		'v.token': token
	};

	return this.findOne(query);
};

RocketChat.models.Rooms.setResponseByRoomId = function(roomId, response) {
	return this.update({
		_id: roomId
	}, {
		$set: {
			responseBy: {
				_id: response.user._id,
				username: response.user.username
			},
			responseDate: response.responseDate,
			responseTime: response.responseTime
		},
		$unset: {
			waitingResponse: 1
		}
	});
};

RocketChat.models.Rooms.closeByRoomId = function(roomId, closeInfo) {
	return this.update({
		_id: roomId
	}, {
		$set: {
			closer: closeInfo.closer,
			closedBy: closeInfo.closedBy,
			closedAt: closeInfo.closedAt,
			chatDuration: closeInfo.chatDuration,
			'v.status': 'offline'
		},
		$unset: {
			open: 1
		}
	});
};

RocketChat.models.Rooms.setLabelByRoomId = function(roomId, label) {
	return this.update({ _id: roomId }, { $set: { label } });
};

RocketChat.models.Rooms.findOpenByAgent = function(userId) {
	const query = {
		open: true,
		'servedBy._id': userId
	};

	return this.find(query);
};

RocketChat.models.Rooms.changeAgentByRoomId = function(roomId, newAgent) {
	const query = {
		_id: roomId
	};
	const update = {
		$set: {
			servedBy: {
				_id: newAgent.agentId,
				username: newAgent.username
			}
		}
	};

	this.update(query, update);
};

RocketChat.models.Rooms.saveCRMDataByRoomId = function(roomId, crmData) {
	const query = {
		_id: roomId
	};
	const update = {
		$set: {
			crmData
		}
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.updateVisitorStatus = function(token, status) {
	const query = {
		'v.token': token,
		open: true
	};

	const update = {
		$set: {
			'v.status': status
		}
	};

	return this.update(query, update);
};
