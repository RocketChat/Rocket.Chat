import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

export function stripSensitiveDataFromSdp<T extends RTCSessionDescriptionInit | null>(sdp: T): T {
	if (!sdp?.sdp) {
		return sdp;
	}

	const { ...data } = sdp;

	return {
		...data,
		sdp: `length=${sdp.sdp.length}`,
	};
}

export function stripSensitiveDataFromSignal<T extends ClientMediaSignal | ServerMediaSignal>(signal: T): Partial<T> {
	const { ...data } = signal;

	if ('sdp' in data) {
		data.sdp = stripSensitiveDataFromSdp(data.sdp);
	}

	return data;
}
