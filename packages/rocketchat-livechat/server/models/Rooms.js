/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function(_id, surveyFeedback) {
	const query = {
		_id: _id
	};

	const update = {
		$set: {
			surveyFeedback: surveyFeedback
		}
	};

	return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function(token, key, value) {
	const query = {
		'v.token': token
	};

	const update = {
		$set: {
			[`livechatData.${key}`]: value
		}
	};

	return this.upsert(query, update);
};

RocketChat.models.Rooms.findLivechat = function(offset = 0, limit = 20) {
	const query = {
		t: 'l'
	};

	return this.find(query, { sort: { ts: - 1 }, offset: offset, limit: limit });
};
