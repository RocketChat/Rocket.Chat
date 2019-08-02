import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';

import CONSTANTS from '../constants';
import { subscribeRooms } from './subscribeRooms';
import SERIALIZE from './serializer';

const NOTIFY_ALL = new EventEmitter();
const NOTIFY_BY_ID = new EventEmitter();

const NOTIFY_ALL_PUBLIC = {
	setting: (data) => NOTIFY_ALL.emit(CONSTANTS.STREAM, SERIALIZE.setting([CONSTANTS.OP.SETTING, data])),
	permission: (data) => NOTIFY_ALL.emit(CONSTANTS.STREAM, SERIALIZE.permission([CONSTANTS.OP.PERMISSION, data])),
};

const NOTIFY_BY_ID_PUBLIC = {
	subscription(uid, data) {
		NOTIFY_BY_ID.emit(uid, SERIALIZE.subscription([CONSTANTS.OP.SUBSCRIPTION, data]));
	},
	room(uid, data) {
		NOTIFY_BY_ID.emit(uid, SERIALIZE.room([CONSTANTS.OP.ROOM, data]));
	},
	message(uid, data) {
		NOTIFY_BY_ID.emit(uid, SERIALIZE.message([CONSTANTS.OP.MESSAGE, data]));
	},
	typing(rid, uid) {
		NOTIFY_BY_ID.emit(rid, SERIALIZE.typing([CONSTANTS.OP.TYPING, uid]));
	},
	recordingAudio(rid, uid) {
		NOTIFY_BY_ID.emit(rid, SERIALIZE.typing([CONSTANTS.OP.RECORDING_AUDIO, uid]));
	},
	recordingVideo(rid, uid) {
		NOTIFY_BY_ID.emit(rid, SERIALIZE.typing([CONSTANTS.OP.RECORDING_VIDEO, uid]));
	},
};

Meteor.publish(CONSTANTS.STREAM, function() { // TODO maybe allow to ignore some events ???
	const user = this;
	const { userId: uid } = user;
	const { socket } = user._session;

	const sendMessage = (msg) => {
		socket.send(msg);
	};

	NOTIFY_ALL.on(CONSTANTS.STREAM, sendMessage);
	NOTIFY_BY_ID.on(uid, sendMessage);

	subscribeRooms(uid).toArray().then((rooms) => {
		rooms.forEach(({ rid }) => NOTIFY_BY_ID.on(rid, sendMessage));

		user.onStop(() => {
			NOTIFY_ALL.removeListener(CONSTANTS.STREAM, sendMessage);
			NOTIFY_BY_ID.removeListener(uid, sendMessage);
			rooms.forEach(({ rid }) => NOTIFY_BY_ID.removeListener(rid, sendMessage));
		});
		user.ready();
	});
});

export { NOTIFY_ALL_PUBLIC as NOTIFY_ALL };
export { NOTIFY_BY_ID_PUBLIC as NOTIFY_BY_ID };
