import { useCallback, useEffect, useMemo, useState } from 'react';

/** How long a pinned person may be gone, as on a reconnect or a reload of their window, before the pin is forgotten. */
export const PIN_GRACE_MS = 30_000;

export type PinnedParticipant = {
	/** Whom the reader pinned, while that person is in the call's video. */
	pinnedId: string | null;
	togglePin: (id: string) => void;
};

/** The one person the reader chose to see large, out of `presentIds`; only this window knows about it. */
export const usePinnedParticipantState = (presentIds: ReadonlySet<string>): PinnedParticipant => {
	const [chosenId, setChosenId] = useState<string | null>(null);
	const present = chosenId !== null && presentIds.has(chosenId);

	useEffect(() => {
		if (chosenId === null || present) {
			return;
		}
		const timeout = setTimeout(() => setChosenId(null), PIN_GRACE_MS);
		return () => clearTimeout(timeout);
	}, [chosenId, present]);

	const togglePin = useCallback((id: string) => setChosenId((current) => (current === id ? null : id)), []);

	const pinnedId = present ? chosenId : null;

	return useMemo(() => ({ pinnedId, togglePin }), [pinnedId, togglePin]);
};
