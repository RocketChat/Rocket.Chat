import { Meteor } from 'meteor/meteor';

import { LivechatVisitors } from '../../../models';

Meteor.methods({
	'livechat:visitorInfo'({ token }) {
		return LivechatVisitors.getVisitorByToken(token);
	},
});
