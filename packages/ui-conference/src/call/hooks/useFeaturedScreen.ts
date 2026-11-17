import { useCallback, useMemo, useState } from 'react';

import type { RemoteParticipantInfo } from '../context';
import type { ScreenChoice, ScreenShare, ShareStarts } from '../lib/screenShares';
import { NO_SCREEN_CHOICE, collectScreenShares, nextScreenChoice, pickFeaturedScreen, recordShareStarts } from '../lib/screenShares';
import type { StageSelf } from '../lib/stageTiles';

export type FeaturedScreen = {
	/** The share on the stage, if any; while none is, the live shares are tiles. */
	featured: ScreenShare | null;
	/** Every live share, the reader's first. */
	shares: ScreenShare[];
	pin: (id: string) => void;
	/** Takes the share off the stage, back to the reader's layout, until they pin one. */
	unpin: () => void;
	/** Forgets which share the reader chose, as when they pin a person instead; an unpinned stage stays unpinned. */
	forget: () => void;
};

type Tracked = { shares: ScreenShare[] | null; starts: ShareStarts; choice: ScreenChoice };

const NOTHING_TRACKED: Tracked = { shares: null, starts: new Map(), choice: NO_SCREEN_CHOICE };

/** Which screen share is large: the reader's choice holds; without one, whichever started last. */
export const useFeaturedScreen = (
	self: Pick<StageSelf, 'id' | 'screenStream'>,
	remoteParticipants: RemoteParticipantInfo[],
): FeaturedScreen => {
	const { id, screenStream } = self;
	const shares = useMemo(() => collectScreenShares({ id, screenStream }, remoteParticipants), [id, screenStream, remoteParticipants]);

	// Brought up to date while rendering, so the share that just started is featured on the render that shows it.
	const [tracked, setTracked] = useState(NOTHING_TRACKED);
	let current = tracked;
	if (tracked.shares !== shares) {
		const { starts } = recordShareStarts(tracked.starts, shares, Date.now());
		current = { shares, starts, choice: nextScreenChoice(tracked.choice, shares) };
		setTracked(current);
	}
	const { starts, choice } = current;

	const pin = useCallback((chosen: string) => setTracked((prev) => ({ ...prev, choice: { chosen, dismissed: false } })), []);
	const unpin = useCallback(() => setTracked((prev) => ({ ...prev, choice: { chosen: null, dismissed: true } })), []);
	const forget = useCallback(() => setTracked((prev) => ({ ...prev, choice: { ...prev.choice, chosen: null } })), []);

	const featured = useMemo(() => pickFeaturedScreen(shares, choice, starts), [shares, choice, starts]);

	return useMemo(() => ({ featured, shares, pin, unpin, forget }), [featured, shares, pin, unpin, forget]);
};
