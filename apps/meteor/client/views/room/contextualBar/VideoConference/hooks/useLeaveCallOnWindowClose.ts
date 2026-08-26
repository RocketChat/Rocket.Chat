import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

/** How often to look at the call window. Cheap, and a second's delay in ending a call nobody is in is nothing. */
const POLL_INTERVAL = 1_000;

/**
 * Reports leaving a call when its window disappears without saying so itself.
 *
 * The conference page reports its own departure on `pagehide`, but it can only do that once it is running. The
 * server counts the user as being in the call from the moment `video-conference.join` is posted — and that is
 * posted *here*, in the main app, before the call window is even opened. Close the window while it is still
 * loading and nothing ever reported the leave: the user stays listed as present in a call they never saw.
 *
 * So the window that opened the call watches it. Only one call is watched at a time, because a user is in one
 * call at a time and the window is shared: opening the next call replaces the watch on the last one.
 *
 * Leaving twice is harmless — the server treats a leave as a statement about the member, not an event — so this
 * doesn't try to work out whether the page managed to report it first.
 */
export const useLeaveCallOnWindowClose = () => {
	const leaveCall = useEndpoint('POST', '/v1/video-conference.leave');
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
			if (!target) {
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
		[leaveCall, stop],
	);
};
