export const STREAM = '0';

let counter = 0; // TODO change to a constant value after some tests;

export const OP = {
	ROOM: String.fromCharCode(counter++),
	MESSAGE: String.fromCharCode(counter++),
	TYPING: String.fromCharCode(counter++),
	RECORDING_VIDEO: String.fromCharCode(counter++),
	RECORDING_AUDIO: String.fromCharCode(counter++),
	SETTING: String.fromCharCode(counter++),
	PERMISSION: String.fromCharCode(counter++),
	SUBSCRIPTION: String.fromCharCode(counter++),
};
