import { useCallback, useEffect, useRef } from 'react';

import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';
import { baseURI } from '../../../lib/baseURI';
import { closeCallWindow } from '../lib/callWindow';

/**
 * How this window's departure should be reported, which is not the same question as whether to report one.
 *
 * `leave` is for someone who was in the call. The other two are for someone who never got that far: a call has
 * to be abandonable from its preflight, and reporting *that* as leaving is a lie with consequences — a call
 * nobody has joined yet has nobody `isInVideoConference`, so one member's leave schedules the empty-call sweep
 * and ends the call for everybody still on their way in.
 *
 * `none` for a member with nothing to report: they were not asked, and they did not arrive.
 */
export type ConferenceDeparture = 'leave' | 'cancel' | 'decline' | 'none';

/**
 * Which of those this window owes the server, given how far its user got.
 *
 * A direct call's creator abandoning the preflight is cancelling the call — that is what `video-conference.cancel`
 * has always meant, and it stops the ring rather than waiting for a sweep to notice nobody came. Someone who was
 * rung and closes it is answering no. Everyone else is `none`: a member who opened a call window of their own
 * accord and closed it again did not leave a call they were never in, and saying they did would end it for the
 * people still arriving.
 */
export const departureFor = ({
	joined,
	isDirect,
	isCreator,
	wasRung,
}: {
	joined: boolean;
	isDirect: boolean;
	isCreator: boolean;
	wasRung: boolean;
}): ConferenceDeparture => {
	if (joined) {
		return 'leave';
	}

	if (isDirect && isCreator) {
		return 'cancel';
	}

	return wasRung ? 'decline' : 'none';
};

/**
 * Reports leaving a conference — on `pagehide`, and on demand.
 *
 * Closing the call window is the only end-of-call signal there is for a provider that doesn't report one, and
 * ending the call is what writes everyone's call history, so without this a call sits at `STARTED` until the
 * expiry cron notices it a day later. The server decides what each report means; this only sends the right one.
 *
 * `pagehide` rather than `beforeunload`: it fires for the bfcache case too, and unlike `unload` it doesn't
 * suppress the cache. The request goes out with `keepalive` because the document is being torn down —
 * `sdk.rest` would have its fetch cancelled with the page. `sendBeacon` can't carry the auth headers the REST
 * API needs, so this uses the credentials the client already holds.
 */

export const useLeaveConferenceOnClose = (callId: string, departure: ConferenceDeparture = 'leave') => {
	// Leaving is reported once per call. Choosing *leave* closes the window, and closing it fires `pagehide` —
	// which would report the same departure a second time. The endpoint is idempotent, so the cost is a wasted
	// request and a duplicate update broadcast to everyone still in the call, but it is still a lie about what
	// happened.
	// Keyed by what was reported as well as which call, so a member who declined from the preflight and then
	// joined anyway still gets their leave reported.
	const reported = useRef<string | undefined>(undefined);

	const reportLeaving = useCallback(() => {
		if (departure === 'none') {
			return;
		}

		const credentials = APIClient.getCredentials();
		if (!credentials) {
			return;
		}

		if (reported.current === `${callId}:${departure}`) {
			return;
		}
		reported.current = `${callId}:${departure}`;

		// Best-effort, and deliberately not checked: `cancel` refuses a call that is no longer ringing, which is
		// a race this cannot win from here and does not need to — the presence sweep collects what it misses.
		return fetch(`${baseURI.replace(/\/$/, '')}/api/v1/video-conference.${departure}`, {
			method: 'POST',
			keepalive: true,
			headers: { ...credentials, 'Content-Type': 'application/json' },
			body: JSON.stringify({ callId }),
		}).catch(() => undefined);
	}, [callId, departure]);

	useEffect(() => {
		const onPageHide = () => void reportLeaving();

		window.addEventListener('pagehide', onPageHide);

		return () => window.removeEventListener('pagehide', onPageHide);
	}, [reportLeaving]);

	/**
	 * Reports and closes the window, for the user who chose to go rather than just closing it — whether that is
	 * leaving a call they were in or abandoning one they never joined.
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
