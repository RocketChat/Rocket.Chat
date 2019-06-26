import { Meteor } from 'meteor/meteor';

import { Messages, LivechatRooms, LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:registerGuest'({ token, name, email, department, customFields } = {}) {
		const userId = Livechat.registerGuest.call(this, {
			token,
			name,
			email,
			department,
		});

		// update visited page history to not expire
		Messages.keepHistoryForToken(token);

		const visitor = LivechatVisitors.getVisitorByToken(token, {
			fields: {
				token: 1,
				name: 1,
				username: 1,
				visitorEmails: 1,
				department: 1,
			},
		});

		// If it's updating an existing visitor, it must also update the roomInfo
		const cursor = LivechatRooms.findOpenByVisitorToken(token);
		cursor.forEach((room) => {
			Livechat.saveRoomInfo(room, visitor);
		});

		if (customFields && customFields instanceof Array) {
			customFields.forEach((customField) => {
				if (typeof customField !== 'object') {
					return;
				}

				if (!customField.scope || customField.scope !== 'room') {
					const { key, value, overwrite } = customField;
					LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
				}
			});
		}

		return {
			userId,
			visitor,
		};
	},
});
