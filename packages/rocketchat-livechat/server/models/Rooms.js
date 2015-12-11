/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function(_id, surveyFeedback) {
	query = {
		_id: _id
	};

	update = {
		$set: {
			surveyFeedback: surveyFeedback
		}
	};

	return this.update(query, update);
};
