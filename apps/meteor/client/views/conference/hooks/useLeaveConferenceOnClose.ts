import { useCallback, useEffect, useRef } from 'react';

import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';
import { baseURI } from '../../../lib/baseURI';
import { closeCallWindow } from '../lib/callWindow';

/**
 * Reports leaving a conference — on `pagehide`, and on demand.
 *
 * Closing the call window is the only end-of-call signal there is for a provider that doesn't report one, and
 * ending the call is what writes everyone's call history, so without this a call sits at `STARTED` until the
 * expiry cron notices it a day later. The server decides what leaving means; this only reports it.
 *
 * `pagehide` rather than `beforeunload`: it fires for the bfcache case too, and unlike `unload` it doesn't
 * suppress the cache. The request goes out with `keepalive` because the document is being torn down —
 * `sdk.rest` would have its fetch cancelled with the page. `sendBeacon` can't carry the auth headers the REST
 * API needs, so this uses the credentials the client already holds.
 */

export const useLeaveConferenceOnClose = (callId: string) => {
	// Leaving is reported once per call. Choosing *leave* closes the window, and closing it fires `pagehide` —
	// which would report the same departure a second time. The endpoint is idempotent, so the cost is a wasted
	// request and a duplicate update broadcast to everyone still in the call, but it is still a lie about what
	// happened.
	const reported = useRef<string | undefined>(undefined);

	const reportLeaving = useCallback(() => {
		const credentials = APIClient.getCredentials();
		if (!credentials) {
			return;
		}

		if (reported.current === callId) {
			return;
		}
		reported.current = callId;

		return fetch(`${baseURI.replace(/\/$/, '')}/api/v1/video-conference.leave`, {
			method: 'POST',
			keepalive: true,
			headers: { ...credentials, 'Content-Type': 'application/json' },
			body: JSON.stringify({ callId }),
		}).catch(() => undefined);
	}, [callId]);

	useEffect(() => {
		const onPageHide = () => void reportLeaving();

		window.addEventListener('pagehide', onPageHide);

		return () => window.removeEventListener('pagehide', onPageHide);
	}, [reportLeaving]);

	/**
	 * Leaves and closes the window, for the user who chose to leave rather than just closing it.
	 *
	 * The report is not waited on: it goes out with `keepalive`, so the browser sees it through the window
	 * closing, and holding the user in front of an unresponsive button until a slow server answers buys nothing.
	 */
	const leaveNow = useCallback(() => {
		void reportLeaving();
		closeCallWindow();
	}, [reportLeaving]);

	return { leaveNow };
};
