import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember, VIDEO_CONF_RINGING_WINDOW_MS } from '@rocket.chat/core-typings';
import { useEffect, useState } from 'react';

/**
 * Anything that can be ringing: a conference member, or a call in a list — both carry the same three fields, and
 * whether they are ringing is decided from those and nothing else.
 */
export type RingingCandidate = Pick<IVideoConferenceUser, 'ringingAt' | 'declined' | 'declinedAt'>;

/**
 * Which of these are ringing right now — and still the right answer a moment later.
 *
 * A ring lapses on its own: nothing announces it, because nothing happened. So a caller that asked once would go
 * on showing a phone ringing until something unrelated moved. This answers with the ones that are ringing and
 * keeps the answer current, which is the part that cannot be done at the call site.
 *
 * The returned list is what the caller renders from; the waiting is this hook's business and nobody else's.
 */
export const useRinging = <T extends RingingCandidate>(candidates: readonly T[]): T[] => {
	const [, setLapsed] = useState(0);

	const now = Date.now();
	const ringing = candidates.filter((candidate) => isRingingVideoConferenceMember(candidate, now));

	// When the soonest of them stops being a ring. Only the live ones are here, so this is always still ahead —
	// which is what makes each wake-up schedule the next: the ring that just lapsed has left the list, and the one
	// behind it is now the soonest. A lapsed ring taken as the soonest would park this on a moment in the past and
	// keep it there, and every later ring would lapse unannounced.
	const earliest = Math.min(...ringing.map(({ ringingAt }) => (ringingAt?.getTime() ?? Infinity) + VIDEO_CONF_RINGING_WINDOW_MS));

	useEffect(() => {
		if (!Number.isFinite(earliest)) {
			return;
		}

		// A little past the window, so the wake-up lands on the far side of it rather than exactly on the edge.
		const timer = setTimeout(() => setLapsed((tick) => tick + 1), Math.max(earliest - Date.now(), 0) + 100);

		return () => clearTimeout(timer);
	}, [earliest]);

	return ringing;
};

/** Whether this one is ringing right now, for a caller that has exactly one to ask about. */
export const useIsRinging = (candidate: RingingCandidate | undefined): boolean => useRinging(candidate ? [candidate] : []).length > 0;
