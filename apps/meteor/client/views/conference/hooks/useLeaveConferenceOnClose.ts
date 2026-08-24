import { useCallback, useEffect } from 'react';

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

	/** Leaves and closes the window, for the user who chose to leave rather than just closing it. */
	const leaveNow = useCallback(async () => {
		await reportLeaving();
		closeCallWindow();
	}, [reportLeaving]);

	return { leaveNow };
};
