export const STREAM = '0';

let counter = 0; // TODO change to a constant value after some tests;

export const OP = {
	ROOM: counter++,
	ROOM_MESSAGE: counter++,
	TYPING: counter++,
	RECORDING_VIDEO: counter++,
	RECORDING_AUDIO: counter++,
	SETTING: counter++,
	PERMISSION: counter++,
	SUBSCRIPTION: counter++,
};
