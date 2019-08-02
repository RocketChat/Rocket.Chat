import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import CONSTANTS from '../constants';

Meteor.startup(function() {
	Tracker.autorun(() => !Meteor.userId() || Meteor.subscribe(CONSTANTS.STREAM));
});

const events = Meteor.connection._stream.eventCallbacks.message;
Meteor.connection._stream.eventCallbacks.message = [(raw_msg) => {
	if (raw_msg[0] === '{') {
		return events.forEach((cb) => cb(raw_msg));
	}

	const [op, payload] = [raw_msg.slice(0, 1), raw_msg.slice(1)];

	switch (op) {
		case CONSTANTS.OP.ROOM:
			console.log('CONSTANTS.OP.ROOM');
			break;
		case CONSTANTS.OP.MESSAGE:
			console.log('CONSTANTS.OP.MESSAGE');
			break;
		case CONSTANTS.OP.TYPING:
			console.log('CONSTANTS.OP.TYPING');
			break;
		case CONSTANTS.OP.RECORDING_VIDEO:
			console.log('CONSTANTS.OP.RECORDING_VIDEO');
			break;
		case CONSTANTS.OP.RECORDING_AUDIO:
			console.log('CONSTANTS.OP.RECORDING_AUDIO');
			break;
		case CONSTANTS.OP.SETTING:
			console.log('CONSTANTS.OP.SETTING');
			break;
		case CONSTANTS.OP.PERMISSION:
			console.log('CONSTANTS.OP.PERMISSION');
			break;
		case CONSTANTS.OP.SUBSCRIPTION:
			console.log('CONSTANTS.OP.SUBSCRIPTION');
			break;
	}
	console.log(payload);
}];
