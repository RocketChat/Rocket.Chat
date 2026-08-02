import { useCallback, useEffect } from 'react';

import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';
import { baseURI } from '../../../lib/baseURI';

/** How long to let `window.close` take effect before assuming it was refused. */
const CLOSE_GRACE = 500;

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
	const reportLeaving = useCallback(() => {
		const credentials = APIClient.getCredentials();
		if (!credentials) {
			return;
		}

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
	 * `window.close` only works on a window that was opened by script, which the call window is — but a
	 * conference reached by pasting the URL isn't, and there is no synchronous way to tell whether the close
	 * took. So give it a moment, then fall back to leaving the page, which gets them out of the call either way.
	 */
	const leaveNow = useCallback(async () => {
		await reportLeaving();
		window.close();
		setTimeout(() => window.location.assign('/home'), CLOSE_GRACE);
	}, [reportLeaving]);

	return { leaveNow };
};
