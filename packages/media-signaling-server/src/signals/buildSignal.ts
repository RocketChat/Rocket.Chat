import type { MediaSignal, MediaSignalBody, MediaSignalHeaderParams, MediaSignalType } from '@rocket.chat/media-signaling';

// This function's only purpose is to make the typecast safer;
// If all the params can be infered to the right types, then the signal can be typecasted.
export function buildSignal<T extends MediaSignalType>(header: MediaSignalHeaderParams, type: T, body: MediaSignalBody<T>): MediaSignal<T> {
	return {
		...header,
		type,
		body,
	} as MediaSignal<T>;
}
