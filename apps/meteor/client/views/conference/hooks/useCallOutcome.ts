import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ConferenceMember = Pick<IVideoConferenceUser, '_id' | 'username' | 'name' | 'joined' | 'declined' | 'declinedAt' | 'leftAt'>;

export type CallOutcome = 'declined' | 'unanswered';

/**
 * How long to wait before calling the first attempt unanswered. Longer than both things that ring it: the
 * caller's client gives up republishing at 30s, and the server stops a direct call's ring at 40s. Deciding
 * sooner would announce "nobody answered" while their phone is still ringing.
 */
const FIRST_RING_WINDOW = 40_000;

/**
 * And how long for a ring the user asked for. A server-originated ring is one-shot — the callee's client aborts
 * it after 10s and nothing repeats it — so waiting the full first-attempt window would leave the caller staring
 * at a call that stopped ringing half a minute ago.
 */
const RERING_WINDOW = 15_000;

/**
 * Identifies *which* decline a member's entry currently records, so a new one can be told from the one already
 * dealt with. Empty when they haven't declined; `declinedAt` is what changes when they decline again, and an
 * entry carrying no timestamp still has to read as a decline rather than as no decline at all.
 */
const declineKey = (member: ConferenceMember) => (member.declined ? `${member.declinedAt?.getTime() ?? 'unknown'}` : '');

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
	/**
	 * The declines already accounted for when the current ring started. `declined` never goes back to false, so
	 * without this a member who declined once would keep the call reported as declined forever — ringing again
	 * would put the modal straight back up instead of waiting to see what they do this time.
	 */
	const [answeredDeclines, setAnsweredDeclines] = useState<Record<string, string>>({});

	const others = useMemo(() => members.filter((member) => member._id !== uid), [members, uid]);
	const someoneElsePresent = others.some(isInVideoConference);
	const everyoneDeclined = others.length > 0 && others.every((member) => declineKey(member) !== (answeredDeclines[member._id] ?? ''));

	useEffect(() => {
		setWaitElapsed(false);
		const timer = setTimeout(() => setWaitElapsed(true), ringToken === 0 ? FIRST_RING_WINDOW : RERING_WINDOW);

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

	const onRang = useCallback(() => {
		// Comparing what each entry records, rather than "declined before now", keeps this honest across the gap
		// between the server's clock and ours.
		setAnsweredDeclines(Object.fromEntries(others.map((member) => [member._id, declineKey(member)])));
		setRingToken((token) => token + 1);
	}, [others]);

	const onDismiss = useCallback(() => setDismissedToken(ringToken), [ringToken]);

	return {
		outcome: outcome && dismissedToken !== ringToken ? outcome : undefined,
		others,
		onRang,
		onDismiss,
	};
};
