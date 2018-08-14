/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding"]}] */
import LivechatVisitors from '../models/LivechatVisitors';
import _ from 'underscore';

Meteor.methods({
	'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
		check(visitorToken, String);
		check(visitorRoom, String);
		check(formData, [Match.ObjectIncluding({ name: String, value: String })]);

		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);
		const room = RocketChat.models.Rooms.findOneById(visitorRoom);

		if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
			const updateData = {};
			for (const item of formData) {
				if (_.contains(['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'], item.name) && _.contains(['1', '2', '3', '4', '5'], item.value)) {
					updateData[item.name] = item.value;
				} else if (item.name === 'additionalFeedback') {
					updateData[item.name] = item.value;
				}
			}
			if (!_.isEmpty(updateData)) {
				return RocketChat.models.Rooms.updateSurveyFeedbackById(room._id, updateData);
			}
		}
	}
});
