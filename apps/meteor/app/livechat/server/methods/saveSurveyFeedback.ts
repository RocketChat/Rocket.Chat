import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatRooms, LivechatVisitors } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult } from 'mongodb';
import _ from 'underscore';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveSurveyFeedback'(
			visitorToken: string,
			visitorRoom: string,
			formData: {
				name: 'satisfaction' | 'agentKnowledge' | 'agentResposiveness' | 'agentFriendliness' | 'additionalFeedback';
				value: '1' | '2' | '3' | '4' | '5';
			}[],
		): UpdateResult | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
		methodDeprecationLogger.method('livechat:saveSurveyFeedback', '7.0.0');

		check(visitorToken, String);
		check(visitorRoom, String);
		check(formData, [Match.ObjectIncluding({ name: String, value: String })]);

		const visitor = (await LivechatVisitors.getVisitorByToken(visitorToken)) ?? undefined;
		const room = (await LivechatRooms.findOneById(visitorRoom)) ?? undefined;

		if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
			const updateData: Partial<
				Record<
					'satisfaction' | 'agentKnowledge' | 'agentResposiveness' | 'agentFriendliness' | 'additionalFeedback',
					'1' | '2' | '3' | '4' | '5'
				>
			> = {};
			for (const item of formData) {
				if (
					['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'].includes(item.name) &&
					['1', '2', '3', '4', '5'].includes(item.value)
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
