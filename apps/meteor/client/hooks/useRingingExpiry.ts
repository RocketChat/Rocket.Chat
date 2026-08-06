import { VIDEO_CONF_RINGING_WINDOW_MS } from '@rocket.chat/core-typings';
import { useEffect, useState } from 'react';

/**
 * Re-renders when the earliest of these rings stops being a ring.
 *
 * A ring lapses on its own — nothing announces it, because nothing happened — so anything that reads "is this
 * ringing?" would keep saying yes until something unrelated moved. Both readers of that question need this: the
 * list, to let a ringing call settle into an ordinary one, and a member's row, to offer to ring them again.
 *
 * @param ringingAt when each ring started; anything absent is ignored.
 */
export const useRingingExpiry = (ringingAt: (Date | undefined)[]): void => {
	const [, setElapsed] = useState(0);

	// The moments are what matter, not the array identity — a fresh array of the same rings must not restart the
	// timer, and callers build these lists inline.
	const earliest = ringingAt.reduce<number | undefined>((soonest, at) => {
		if (!at) {
			return soonest;
		}

		const stopsAt = at.getTime() + VIDEO_CONF_RINGING_WINDOW_MS;
		return soonest === undefined || stopsAt < soonest ? stopsAt : soonest;
	}, undefined);

	useEffect(() => {
		if (earliest === undefined) {
			return;
		}

		// A little past the window, so the wake-up lands on the far side of it rather than exactly on the edge.
		const timer = setTimeout(() => setElapsed((tick) => tick + 1), Math.max(earliest - Date.now(), 0) + 100);

		return () => clearTimeout(timer);
	}, [earliest]);
};
