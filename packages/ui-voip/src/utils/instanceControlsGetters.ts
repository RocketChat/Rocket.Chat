import type { MediaSignalingSession } from '@rocket.chat/media-signaling';

export const getEndCall = (instance?: MediaSignalingSession) => () => {
	if (!instance) {
		return;
	}
	const instanceState = instance.getState();
	if (!instanceState) {
		return;
	}

	const {
		call,
		localParticipant: { role },
	} = instanceState;

	if (role === 'caller' || instanceState.state !== 'ringing') {
		call.hangup();
		return;
	}
	call.reject();
};
