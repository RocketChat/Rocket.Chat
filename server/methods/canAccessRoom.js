import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { Match, check } from 'meteor/check';

Meteor.methods({
	canAccessRoom(rid, uid, extraData) {
		check(rid, String);
		check(uid, Match.Maybe(String));
		return RocketChat.Services.call('authorization.canAccessRoom', { rid, uid, extraData });
	},
});
