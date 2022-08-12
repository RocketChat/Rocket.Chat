import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Spotlight } from '../lib/spotlight';

Meteor.methods({
	spotlight(text, usernames = [], type = { users: true, rooms: true, mentions: false }, rid) {
		const spotlight = new Spotlight();
		const { mentions } = type;

		if (text.startsWith('#')) {
			type.users = false;
			text = text.slice(1);
		}

		if (text.startsWith('@')) {
			type.rooms = false;
			text = text.slice(1);
		}

		const { userId } = this;

		return {
			users: type.users ? spotlight.searchUsers({ userId, rid, text, usernames, mentions }) : [],
			rooms: type.rooms ? spotlight.searchRooms({ userId, text }) : [],
		};
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'spotlight',
		userId(/* userId*/) {
			return true;
		},
	},
	100,
	100000,
);
