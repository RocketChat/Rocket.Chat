import { Meteor } from 'meteor/meteor';

import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:pageVisited'(token, room, pageInfo) {
		Livechat.savePageHistory(token, room, pageInfo);
	},
});
