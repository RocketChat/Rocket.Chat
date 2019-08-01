import { Meteor } from 'meteor/meteor';

import { LivechatSessions } from '../../../models';

Meteor.methods({
	'livechat:updateChatStatus'({ token }) {
		console.log('this is token', token);

		const test = LivechatSessions.updateChatStatusOnRoomCloseOrDeleteByToken(token, 'Not Started');
		console.log('ths', test);
		return test;
	},
});
