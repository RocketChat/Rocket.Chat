import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';

import CONSTANTS from '../constants';
import { subscribeRooms } from './subscribeRooms';
import SERIALIZE from '../serializer';

const NOTIFY_ALL = new EventEmitter();
export const INTERNALS = new EventEmitter();
const NOTIFY_BY_ID = new EventEmitter();

const NOTIFY_ALL_PUBLIC = {
	setting: (data) => NOTIFY_ALL.emit(CONSTANTS.STREAM, CONSTANTS.OP.SETTING + SERIALIZE.setting(data)),
	permission: (data) => NOTIFY_ALL.emit(CONSTANTS.STREAM, CONSTANTS.OP.PERMISSION + SERIALIZE.permission(data)),
};

const NOTIFY_BY_ID_PUBLIC = {
	subscription(uid, data) {
		NOTIFY_BY_ID.emit(uid, CONSTANTS.OP.SUBSCRIPTION + SERIALIZE.subscription(data));
	},
	room(uid, data) {
		NOTIFY_BY_ID.emit(uid, CONSTANTS.OP.ROOM + SERIALIZE.room(data));
	},
	message(uid, data) {
		NOTIFY_BY_ID.emit(uid, CONSTANTS.OP.MESSAGE + SERIALIZE.message(data));
	},
	typing(rid, uid) {
		NOTIFY_BY_ID.emit(rid, CONSTANTS.OP.TYPING + SERIALIZE.typing(uid));
	},
	recordingAudio(rid, uid) {
		NOTIFY_BY_ID.emit(rid, CONSTANTS.OP.RECORDING_AUDIO + SERIALIZE.typing(uid));
	},
	recordingVideo(rid, uid) {
		NOTIFY_BY_ID.emit(rid, CONSTANTS.OP.RECORDING_VIDEO + SERIALIZE.typing(uid));
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

		const userEvent = (clientAction, { rid }) => {
			switch (clientAction) {
				case 'inserted':
					rooms.push({ rid });
					NOTIFY_BY_ID.on(rid, sendMessage);
					break;

				case 'removed':
					NOTIFY_BY_ID.removeListener(rid, sendMessage);
					break;
			}
		};

		user.onStop(() => {
			NOTIFY_ALL.removeListener(CONSTANTS.STREAM, sendMessage);
			NOTIFY_BY_ID.removeListener(uid, sendMessage);
			INTERNALS.removeListener(uid, userEvent);
			rooms.forEach(({ rid }) => NOTIFY_BY_ID.removeListener(rid, sendMessage));
		});

		INTERNALS.on(uid, userEvent);
		user.ready();
	});
});

export { NOTIFY_ALL_PUBLIC as NOTIFY_ALL };
export { NOTIFY_BY_ID_PUBLIC as NOTIFY_BY_ID };
