import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCallState } from '../context';
import type { CallPins } from '../lib/callPins';
import { NO_PINS, SCREENS_DISMISSED, pinScreen, pinnedIdOf, pinsForShares, togglePersonPin, unpinPerson } from '../lib/callPins';
import type { ScreenShare, ShareStarts } from '../lib/screenShares';
import { collectScreenShares, pickFeaturedScreen, recordShareStarts } from '../lib/screenShares';

/** How long a pinned person may be gone, as on a reconnect or a reload of their window, before the pin is forgotten. */
export const PIN_GRACE_MS = 30_000;

export type CallPinsValue = {
	/** Whom the reader pinned, while that person is in the call. */
	pinnedId: string | null;
	/** Every live share, the reader's first. */
	shares: ScreenShare[];
	screenOnStage: ScreenShare | null;
	togglePin: (participantId: string) => void;
	toggleScreenPin: (sharerId: string) => void;
};

type Tracked = { shares: ScreenShare[] | null; starts: ShareStarts; pins: CallPins };

const NOTHING_TRACKED: Tracked = { shares: null, starts: new Map(), pins: NO_PINS };

/** The reader's one pin, a person or a shared screen, and what it puts on the stage. */
export const useCallPinsState = (): CallPinsValue => {
	const { self, remoteParticipants } = useCallState();
	const { id: selfId, screenStream } = self;
	const shares = useMemo(
		() => collectScreenShares({ id: selfId, screenStream: screenStream ?? null }, remoteParticipants),
		[selfId, screenStream, remoteParticipants],
	);

	// Brought up to date while rendering, so the share that just started is on the stage on the render that shows it.
	const [tracked, setTracked] = useState(NOTHING_TRACKED);
	let current = tracked;
	if (tracked.shares !== shares) {
		current = { shares, starts: recordShareStarts(tracked.starts, shares, Date.now()), pins: pinsForShares(tracked.pins, shares) };
		setTracked(current);
	}
	const { starts, pins } = current;

	const setPins = useCallback((next: (pins: CallPins) => CallPins) => setTracked((prev) => ({ ...prev, pins: next(prev.pins) })), []);

	const chosenPersonId = pinnedIdOf(pins, 'person');
	const present = chosenPersonId === selfId || remoteParticipants.some(({ id }) => id === chosenPersonId);

	useEffect(() => {
		if (chosenPersonId === null || present) {
			return;
		}
		const timeout = setTimeout(() => setPins((pins) => unpinPerson(pins, chosenPersonId)), PIN_GRACE_MS);
		return () => clearTimeout(timeout);
	}, [chosenPersonId, present, setPins]);

	const pinnedId = present ? chosenPersonId : null;
	const pinnedScreenId = pinnedIdOf(pins, 'screen');
	const { screensDismissed } = pins;

	const screenOnStage = useMemo(
		() => (pinnedId !== null || screensDismissed ? null : pickFeaturedScreen(shares, pinnedScreenId, starts)),
		[pinnedId, screensDismissed, shares, pinnedScreenId, starts],
	);
	const screenOnStageId = screenOnStage?.id;

	const togglePin = useCallback((participantId: string) => setPins((pins) => togglePersonPin(pins, participantId)), [setPins]);
	const toggleScreenPin = useCallback(
		(sharerId: string) => setPins(() => (sharerId === screenOnStageId ? SCREENS_DISMISSED : pinScreen(sharerId))),
		[setPins, screenOnStageId],
	);

	return useMemo(
		() => ({ pinnedId, shares, screenOnStage, togglePin, toggleScreenPin }),
		[pinnedId, shares, screenOnStage, togglePin, toggleScreenPin],
	);
};
