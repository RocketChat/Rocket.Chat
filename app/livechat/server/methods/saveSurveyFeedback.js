import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import _ from 'underscore';

import { LivechatRooms, LivechatVisitors } from '../../../models';

Meteor.methods({
	'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
		check(visitorToken, String);
		check(visitorRoom, String);
		check(formData, [Match.ObjectIncluding({ name: String, value: String })]);

		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);
		const room = LivechatRooms.findOneById(visitorRoom);

		if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
			const updateData = {};
			for (const item of formData) {
				if (
					_.contains(['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'], item.name) &&
					_.contains(['1', '2', '3', '4', '5'], item.value)
				) {
					updateData[item.name] = item.value;
				} else if (item.name === 'additionalFeedback') {
					updateData[item.name] = item.value;
				}
			}
			if (!_.isEmpty(updateData)) {
				return LivechatRooms.updateSurveyFeedbackById(room._id, updateData);
			}
		}
	},
});
