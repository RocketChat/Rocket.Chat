import { useEffect, useMemo, useRef, useState } from 'react';

import type { RemoteParticipantInfo } from '../context';
import type { ScreenShare, ShareStarts } from '../lib/screenShares';
import { collectScreenShares, nextPinnedScreen, pickFeaturedScreen, recordShareStarts } from '../lib/screenShares';
import type { StageSelf } from '../lib/stageTiles';

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

	const startsRef = useRef<ShareStarts>(new Map());
	const [pinned, setPinned] = useState<string | null>(null);

	useEffect(() => {
		const { starts, started } = recordShareStarts(startsRef.current, shares, Date.now());
		startsRef.current = starts;
		setPinned((prev) => nextPinnedScreen(prev, started, shares));
	}, [shares]);

	const featured = useMemo(() => pickFeaturedScreen(shares, pinned, startsRef.current), [shares, pinned]);
	const others = useMemo(() => (featured ? shares.filter((share) => share.id !== featured.id) : []), [shares, featured]);

	return { featured, others, pin: setPinned };
};
