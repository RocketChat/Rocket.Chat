import type { MediaSignalingSession } from '@rocket.chat/media-signaling';

export const getEndCall = (instance?: MediaSignalingSession) => () => {
	if (!instance) {
		return;
	}
	const mainCall = instance.getMainCall();
	if (!mainCall) {
		return;
	}
	const { role } = mainCall;
	if (role === 'caller' || mainCall.state !== 'ringing') {
		mainCall.hangup();
		return;
	}
	mainCall.reject();
};
