import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useEffect, useState } from 'react';

import { useHeld } from './useHeld.js';
import type { ConferenceIncomingMessage, ConferenceRoom } from '../context/definitions.js';
import { MESSAGE_PREVIEW_VISIBLE_MS } from '../lib/constants.js';

type ShownMessage = ConferenceIncomingMessage & { shownAt: number };

type CallMessagePreviewsOptions = {
	/** While true nothing is previewed, and what was showing is cleared. */
	paused: boolean;
	/** How many are shown at once; the latest ones win. */
	limit: number;
};

type CallMessagePreviews = {
	messages: ConferenceIncomingMessage[];
	dismiss: (mid: string) => void;
	/** For the element the previews are drawn in: while someone is busy with it, none of them leaves. */
	holdRef: RefCallback<HTMLElement>;
};

/**
 * The chat messages to preview over the call right now: each stays for a while and then leaves, oldest first.
 * While the previews are held nothing leaves and nothing is replaced, so what someone is reading or about to
 * press stays where it is; newer messages wait for them to let go.
 */
export const useCallMessagePreviews = (
	subscribe: NonNullable<ConferenceRoom['incomingMessages']>['subscribe'] | undefined,
	{ paused, limit }: CallMessagePreviewsOptions,
): CallMessagePreviews => {
	const [holdRef, held] = useHeld();
	const [shown, setShown] = useState<ShownMessage[]>([]);

	const show = useStableCallback((message: ConferenceIncomingMessage) => {
		if (paused) {
			return;
		}

		setShown((shown) => {
			const next = [...shown, { ...message, shownAt: Date.now() }];
			return held ? next : next.slice(-limit);
		});
	});

	useEffect(() => subscribe?.(show), [subscribe, show]);

	useEffect(() => {
		if (paused) {
			setShown((shown) => (shown.length ? [] : shown));
		}
	}, [paused]);

	useEffect(() => {
		if (held) {
			return;
		}

		// Letting go gives every preview its whole time again, as the one that was held would otherwise leave at once.
		setShown((shown) => (shown.length ? shown.slice(-limit).map((message) => ({ ...message, shownAt: Date.now() })) : shown));
	}, [held, limit]);

	const dismiss = (mid: string) => setShown((shown) => shown.filter(({ _id }) => _id !== mid));

	const [oldest] = shown;

	useEffect(() => {
		if (held || !oldest) {
			return;
		}

		const timer = setTimeout(
			() => setShown((shown) => shown.filter(({ shownAt }) => shownAt + MESSAGE_PREVIEW_VISIBLE_MS > Date.now())),
			Math.max(oldest.shownAt + MESSAGE_PREVIEW_VISIBLE_MS - Date.now(), 0),
		);

		return () => clearTimeout(timer);
	}, [held, oldest]);

	return { messages: held ? shown.slice(0, limit) : shown.slice(-limit), dismiss, holdRef };
};
