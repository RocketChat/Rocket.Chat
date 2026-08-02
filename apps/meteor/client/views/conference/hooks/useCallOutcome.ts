import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ConferenceMember = Pick<IVideoConferenceUser, '_id' | 'username' | 'name' | 'joined' | 'declined' | 'leftAt'>;

export type CallOutcome = 'declined' | 'unanswered';

/**
 * How long to wait before calling it unanswered. Longer than both things that ring: the caller's client gives
 * up republishing at 30s, and the server stops a direct call's ring at 40s. Deciding sooner would announce
 * "nobody answered" while their phone is still ringing.
 */
const RING_WINDOW = 40_000;

/**
 * Watches the other members of a call the user is in and reports when the call went nowhere — everyone declined,
 * or nobody picked up. Since the call window now opens as soon as the caller places the call, this is what
 * replaces the outgoing popup they used to sit in front of: the wait, and its outcome, belong here.
 *
 * Nothing is reported while anyone else is present, or when there is nobody else to wait for — a conference
 * started in a channel rings nobody in particular, and silence there isn't an outcome.
 */
export const useCallOutcome = (members: ConferenceMember[]) => {
	const uid = useUserId();
	// Bumped on every fresh ring, which restarts the wait and makes any earlier dismissal stale.
	const [ringToken, setRingToken] = useState(0);
	const [dismissedToken, setDismissedToken] = useState<number>();
	const [waitElapsed, setWaitElapsed] = useState(false);

	const others = useMemo(() => members.filter((member) => member._id !== uid), [members, uid]);
	const someoneElsePresent = others.some(isInVideoConference);
	const everyoneDeclined = others.length > 0 && others.every(({ declined }) => declined);

	useEffect(() => {
		setWaitElapsed(false);
		const timer = setTimeout(() => setWaitElapsed(true), RING_WINDOW);

		return () => clearTimeout(timer);
	}, [ringToken]);

	const outcome = ((): CallOutcome | undefined => {
		if (!others.length || someoneElsePresent) {
			return undefined;
		}

		if (everyoneDeclined) {
			return 'declined';
		}

		return waitElapsed ? 'unanswered' : undefined;
	})();

	const onRang = useCallback(() => setRingToken((token) => token + 1), []);
	const onDismiss = useCallback(() => setDismissedToken(ringToken), [ringToken]);

	return {
		outcome: outcome && dismissedToken !== ringToken ? outcome : undefined,
		others,
		onRang,
		onDismiss,
	};
};
