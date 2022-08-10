import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';

import { Messages, LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:registerGuest'({ token, name, email, department, customFields } = {}) {
		const userId = await Livechat.registerGuest.call(this, {
			token,
			name,
			email,
			department,
		});

		// update visited page history to not expire
		Messages.keepHistoryForToken(token);

		const visitor = await LivechatVisitors.getVisitorByToken(token, {
			projection: {
				token: 1,
				name: 1,
				username: 1,
				visitorEmails: 1,
				department: 1,
			},
		});

		// If it's updating an existing visitor, it must also update the roomInfo
		const rooms = LivechatRooms.findOpenByVisitorToken(token).fetch();
		await Promise.all(rooms.map((room) => Livechat.saveRoomInfo(room, visitor)));

		if (customFields && customFields instanceof Array) {
			// TODO: refactor to use normal await
			customFields.forEach((customField) => {
				if (typeof customField !== 'object') {
					return;
				}

				if (!customField.scope || customField.scope !== 'room') {
					const { key, value, overwrite } = customField;
					Promise.await(LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite));
				}
			});
		}

		return {
			userId,
			visitor,
		};
	},
});
