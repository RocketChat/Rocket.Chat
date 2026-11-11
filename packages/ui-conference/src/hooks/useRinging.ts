import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember, VIDEO_CONF_RINGING_WINDOW_MS } from '@rocket.chat/core-typings';
import { useEffect, useState } from 'react';

/** Anything that can be ringing: a conference member, or a call in a list. */
export type RingingCandidate = Pick<IVideoConferenceUser, 'ringingAt' | 'declined' | 'declinedAt'>;

/**
 * Which of these are ringing right now — and still the right answer a moment later. A ring lapses on its own
 * with nothing to announce it, so a caller that asked once would go on showing a phone ringing.
 */
export const useRinging = <T extends RingingCandidate>(candidates: readonly T[]): T[] => {
	const [, setLapsed] = useState(0);

	const now = Date.now();
	const ringing = candidates.filter((candidate) => isRingingVideoConferenceMember(candidate, now));

	// When the soonest of them stops being a ring. Only the live ones are here, so this is always still ahead,
	// which is what makes each wake-up schedule the next.
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
