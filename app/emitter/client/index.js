import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import EventEmitter from 'wolfy87-eventemitter';

import { deserializer } from '../serializer';
import CONSTANTS from '../constants';

export { CONSTANTS };

Meteor.startup(function() {
	Tracker.autorun(() => !Meteor.userId() || Meteor.subscribe(CONSTANTS.STREAM));
});


export const events = new EventEmitter();

const _events = Meteor.connection._stream.eventCallbacks.message;
Meteor.connection._stream.eventCallbacks.message = [(raw_msg) => {
	if (raw_msg[0] === '{') {
		return _events.forEach((cb) => cb(raw_msg));
	}

	const [op, payload] = [raw_msg.slice(0, 1), raw_msg.slice(1)];

	switch (op) {
		case CONSTANTS.OP.ROOM:
			console.log('CONSTANTS.OP.ROOM');
			console.log(deserializer.room(payload));
			break;
		case CONSTANTS.OP.MESSAGE:
			console.log('CONSTANTS.OP.MESSAGE');
			console.log(deserializer.message(payload));
			break;
		case CONSTANTS.OP.SUBSCRIPTION:
			events.emit(
				CONSTANTS.OP.SUBSCRIPTION,
				deserializer.subscription(payload)
			);
			console.log('CONSTANTS.OP.SUBSCRIPTION');
			console.log(deserializer.subscription(payload));
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
		default:
			console.log(payload);
	}
}];
