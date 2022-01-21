import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Rooms } from '../../../models';

export const saveStreamingOptions = function (rid, options) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveStreamingOptions',
		});
	}

	check(options, {
		id: Match.Optional(String),
		type: Match.Optional(String),
		url: Match.Optional(String),
		thumbnail: Match.Optional(String),
		isAudioOnly: Match.Optional(Boolean),
		message: Match.Optional(String),
	});

	Rooms.setStreamingOptionsById(rid, options);
};
