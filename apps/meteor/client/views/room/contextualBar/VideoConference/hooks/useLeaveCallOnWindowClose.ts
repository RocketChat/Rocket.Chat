import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import { useCallback, useEffect, useRef } from 'react';


/** How often to look at the call window. Cheap, and a second's delay in ending a call nobody is in is nothing. */
const POLL_INTERVAL = 1_000;

/**
 * Reports leaving a call when its window disappears without saying so itself.
 *
 * Returns a watch over one call at a time: starting the next drops the last, and there is nothing to watch
 * without a call window of ours. See [the feature
 * doc](../../../../../../../../docs/features/video-conference-persistent-chat/README.md#the-window-that-opened-the-call-watches-it).
 */
export const useLeaveCallOnWindowClose = () => {
	const leaveCall = useEndpoint('POST', '/v1/video-conference.leave');
	const conferenceWindowEnabled = useVideoConfWindowEnabled();
	const watching = useRef<ReturnType<typeof setInterval>>(undefined);

	const stop = useCallback(() => {
		clearInterval(watching.current);
		watching.current = undefined;
	}, []);

	// Not on unmount of whatever is watching: the main app reloading or navigating away is not the call window
	// closing, and the call window is deliberately outliving both.
	useEffect(() => stop, [stop]);

	return useCallback(
		(callId: string, target: Window | null | undefined) => {
			stop();

			// No window to watch: the desktop app manages its own, and a blocked popup never opened one.
			if (!target || !conferenceWindowEnabled) {
				return;
			}

			watching.current = setInterval(() => {
				if (!target.closed) {
					return;
				}

				stop();
				void leaveCall({ callId }).catch(() => undefined);
			}, POLL_INTERVAL);
		},
		[conferenceWindowEnabled, leaveCall, stop],
	);
};
