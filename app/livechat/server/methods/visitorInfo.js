import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models';

Meteor.methods({
	'livechat:getRoomInfo'({ token }) {
		return Rooms.findLivechatByVisitorToken(token);
	},
});
