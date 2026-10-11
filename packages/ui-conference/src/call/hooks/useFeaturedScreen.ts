import { useCallback, useMemo, useState } from 'react';

import type { RemoteParticipantInfo } from '../context';
import type { ScreenShare, ShareStarts } from '../lib/screenShares';
import { collectScreenShares, nextPinnedScreen, pickFeaturedScreen, recordShareStarts } from '../lib/screenShares';
import type { StageSelf } from '../lib/stageTiles';

type Tracked = { shares: ScreenShare[] | null; starts: ShareStarts; pinned: string | null };

const NOTHING_TRACKED: Tracked = { shares: null, starts: new Map(), pinned: null };

/**
 * The screen share shown large and the rest, beside it. A share that starts takes the stage over whatever was
 * pinned; `pin` is the reader choosing another one.
 */
export const useFeaturedScreen = (
	self: Pick<StageSelf, 'id' | 'screenStream'>,
	remoteParticipants: RemoteParticipantInfo[],
): { featured: ScreenShare | null; others: ScreenShare[]; pin: (id: string) => void } => {
	const { id, screenStream } = self;
	const shares = useMemo(() => collectScreenShares({ id, screenStream }, remoteParticipants), [id, screenStream, remoteParticipants]);

	// Brought up to date while rendering, so the share that just started is featured on the render that shows it.
	const [tracked, setTracked] = useState(NOTHING_TRACKED);
	let current = tracked;
	if (tracked.shares !== shares) {
		const { starts, started } = recordShareStarts(tracked.starts, shares, Date.now());
		current = { shares, starts, pinned: nextPinnedScreen(tracked.pinned, started, shares) };
		setTracked(current);
	}
	const { starts, pinned } = current;

	const pin = useCallback((pinnedId: string) => setTracked((prev) => ({ ...prev, pinned: pinnedId })), []);

	const featured = useMemo(() => pickFeaturedScreen(shares, pinned, starts), [shares, pinned, starts]);
	const others = useMemo(() => (featured ? shares.filter((share) => share.id !== featured.id) : []), [shares, featured]);

	return { featured, others, pin };
};
