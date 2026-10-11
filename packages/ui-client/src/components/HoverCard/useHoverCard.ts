import type { Popover } from '@rocket.chat/fuselage';
import { useDebouncedCallback, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, RefObject, UIEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useHoverCardDismissal } from './useHoverCardDismissal';

type PopoverState = ComponentProps<typeof Popover>['state'];

const canHover = () => typeof window.matchMedia !== 'function' || window.matchMedia('(hover: hover)').matches;

export type UseHoverCardOptions = {
	openDelay?: number;
	closeDelay?: number;
};

export type HoverCardController<TKey> = {
	/** What the card is showing, or `undefined` while it is closed. */
	shownKey: TKey | undefined;
	triggerRef: RefObject<Element | null>;
	cardRef: (card: HTMLElement | null) => (() => void) | undefined;
	popoverState: PopoverState;
	/** Hovering waits out the open delay; a click opens right away. */
	open: (event: UIEvent, key: TKey) => void;
	/** Closes now and drops a pending open. */
	dismiss: () => void;
};

/**
 * Hover intent for a card shown next to whatever was hovered or clicked: every card waits out the open delay,
 * including the next one while a card is showing, so sweeping the pointer across triggers doesn't pop cards; an open
 * card lingers briefly after the pointer leaves it or its trigger. Hover never opens a card on devices without one.
 */
export const useHoverCard = <TKey>({ openDelay = 500, closeDelay = 300 }: UseHoverCardOptions = {}): HoverCardController<TKey> => {
	const [shownKey, setShownKey] = useState<TKey>();
	const triggerRef = useRef<Element | null>(null);
	const lastTriggerRef = useRef<Element | null>(null);

	const show = useStableCallback((trigger: Element | null, key: TKey) => {
		triggerRef.current = trigger;
		setShownKey(() => key);
	});

	const openLater = useDebouncedCallback(show, openDelay, []);
	const closeLater = useDebouncedCallback(() => setShownKey(undefined), closeDelay, []);
	useEffect(
		() => () => {
			openLater.cancel();
			closeLater.cancel();
		},
		[openLater, closeLater],
	);

	const leave = useStableCallback(() => {
		openLater.cancel();
		if (shownKey !== undefined) {
			closeLater();
		}
	});

	const keepOpen = useStableCallback(() => {
		openLater.cancel();
		closeLater.cancel();
	});

	const dismiss = useStableCallback(() => {
		openLater.cancel();
		closeLater.cancel();
		setShownKey(undefined);
	});

	// Adjacent triggers report the next one's enter before the previous one's leave; only the latest trigger counts.
	const handleTriggerLeave = useStableCallback((event: Event) => {
		if (event.currentTarget === lastTriggerRef.current) {
			leave();
		}
	});

	const open = useStableCallback((event: UIEvent, key: TKey) => {
		const trigger = (event.currentTarget ?? event.target) as Element | null;
		const viaClick = event.type === 'click';

		if (!viaClick && !canHover()) {
			return;
		}

		lastTriggerRef.current = trigger;
		if (!viaClick) {
			trigger?.addEventListener('mouseleave', handleTriggerLeave, { once: true });
		}

		// Another trigger for what is already shown (an avatar next to a name): keep the card where it is.
		if (shownKey !== undefined && Object.is(shownKey, key)) {
			keepOpen();
			return;
		}

		if (viaClick) {
			openLater.cancel();
			show(trigger, key);
			return;
		}

		openLater(trigger, key);
	});

	const cardRef = useHoverCardDismissal({ onPointerEnter: keepOpen, onPointerLeave: leave, onDismiss: dismiss });

	const isOpen = shownKey !== undefined;
	const popoverState: PopoverState = {
		isOpen,
		setOpen: (next) => {
			if (!next) {
				dismiss();
			}
		},
		open: () => undefined,
		close: dismiss,
		toggle: () => {
			if (isOpen) {
				dismiss();
			}
		},
	};

	return { shownKey, triggerRef, cardRef, popoverState, open, dismiss };
};
