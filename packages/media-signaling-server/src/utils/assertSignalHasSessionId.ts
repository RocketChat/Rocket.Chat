import type { MediaSignal } from '@rocket.chat/media-signaling';

export function assertSignalHasSessionId(
	signal: MediaSignal,
): asserts signal is MediaSignal & { sessionId: Required<MediaSignal>['sessionId'] } {
	if (!signal.sessionId) {
		throw new Error('invalid-signal-session');
	}
}
