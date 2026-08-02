import { useEffect } from 'react';

import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';
import { baseURI } from '../../../lib/baseURI';

/**
 * Tells the server the user left when the conference window goes away.
 *
 * Closing that window is the only end-of-call signal there is for a provider that doesn't report one back, and
 * ending the call is what writes everyone's call history — so without this a call sits at `STARTED` until the
 * expiry cron notices it a day later. The server decides what leaving means; this only reports it.
 *
 * `pagehide` rather than `beforeunload`: it fires for the bfcache case too, and unlike `unload` it doesn't
 * suppress the cache. The request goes out with `keepalive` because the document is being torn down —
 * `sdk.rest` would have its fetch cancelled with the page. `sendBeacon` can't carry the auth headers the REST
 * API needs, so this uses the credentials the client already holds.
 */
export const useLeaveConferenceOnClose = (callId: string): void => {
	useEffect(() => {
		const reportLeaving = () => {
			const credentials = APIClient.getCredentials();
			if (!credentials) {
				return;
			}

			void fetch(`${baseURI.replace(/\/$/, '')}/api/v1/video-conference.leave`, {
				method: 'POST',
				keepalive: true,
				headers: { ...credentials, 'Content-Type': 'application/json' },
				body: JSON.stringify({ callId }),
			}).catch(() => undefined);
		};

		window.addEventListener('pagehide', reportLeaving);

		return () => window.removeEventListener('pagehide', reportLeaving);
	}, [callId]);
};
