import { useDebouncedState, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { TooltipContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, memo, useState } from 'react';

import { TooltipComponent } from '../components/TooltipComponent';

export type TooltipProviderProps = {
	children?: ReactNode;
	ownerDocument?: Document;
};

const stashAnchorTitle = (anchor: HTMLElement, title: string): void => {
	if (!anchor.hasAttribute('title')) {
		return;
	}
	anchor.setAttribute('data-title', title);
	anchor.setAttribute('title', '');
};

const restoreAnchorTitle = (anchor: HTMLElement): void => {
	if (!anchor.hasAttribute('data-title')) {
		return;
	}
	if (!anchor.getAttribute('title')) {
		anchor.setAttribute('title', anchor.getAttribute('data-title') ?? '');
	}
	anchor.removeAttribute('data-title');
};

// When the pointer is outside the hovered element's box, a pseudo-element stretched over its container, such as a
// link that covers its whole row, is taking the hover from the content beneath it.
const findCoveredAnchor = (element: HTMLElement, x: number, y: number): HTMLElement | null => {
	const container = element.offsetParent;
	if (!container) {
		return null;
	}

	const rect = element.getBoundingClientRect();
	if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
		return null;
	}

	const covered = element.ownerDocument
		.elementsFromPoint(x, y)
		.find((candidate) => !element.contains(candidate) && container.contains(candidate) && candidate !== container);
	const anchor = covered?.closest<HTMLElement>('[title], [data-tooltip]');

	return anchor && container.contains(anchor) ? anchor : null;
};

const findAnchor = (element: HTMLElement, x: number, y: number): HTMLElement | null =>
	findCoveredAnchor(element, x, y) ?? element.closest<HTMLElement>('[title], [data-tooltip]');

const TooltipProvider = ({ children, ownerDocument = window.document }: TooltipProviderProps) => {
	const lastAnchor = useRef<HTMLElement>(undefined);
	const lastLeaveTarget = useRef<HTMLElement>(undefined);
	const dismissedAnchor = useRef<HTMLElement>(undefined);
	const hasHover = !useMediaQuery('(hover: none)');

	const [tooltip, setTooltip] = useDebouncedState<ReactNode>(null, 300);

	const contextValue = useMemo(
		() => ({
			open: (tooltip: ReactNode, anchor: HTMLElement): void => {
				setTooltip(<TooltipComponent key={new Date().toISOString()} title={tooltip} anchor={anchor} />);
				lastAnchor.current = anchor;
				lastLeaveTarget.current = undefined;
			},
			close: (): void => {
				setTooltip(null);
				setTooltip.flush();
				lastAnchor.current = undefined;
				lastLeaveTarget.current = undefined;
			},
			dismiss: (): void => {
				const anchor = lastAnchor.current;
				const leaveTarget = lastLeaveTarget.current ?? anchor;
				setTooltip(null);
				setTooltip.flush();

				if (anchor && leaveTarget) {
					dismissedAnchor.current = anchor;
					const restoreOnLeave = (): void => {
						restoreAnchorTitle(anchor);
						if (dismissedAnchor.current === anchor) {
							dismissedAnchor.current = undefined;
						}
						if (lastAnchor.current === anchor) {
							lastAnchor.current = undefined;
						}
					};
					leaveTarget.addEventListener('mouseleave', restoreOnLeave, { once: true });
				}
			},
		}),
		[setTooltip],
	);

	useEffect(() => {
		if (!hasHover) {
			return;
		}

		let hovered: HTMLElement | undefined;

		const showTooltipAt = (e: MouseEvent): void => {
			if (!hovered) {
				return;
			}

			const target = hovered;
			const anchor = findAnchor(target, e.clientX, e.clientY);

			// A covered anchor never receives `mouseleave`, so the pointer resolving elsewhere is what ends its dismissal.
			const dismissed = dismissedAnchor.current;
			if (dismissed && dismissed !== anchor) {
				restoreAnchorTitle(dismissed);
				dismissedAnchor.current = undefined;
			}

			if ((lastAnchor.current ?? null) === anchor) {
				return;
			}

			if (!anchor) {
				contextValue.close();
				return;
			}

			const title = anchor.getAttribute('title') ?? anchor.getAttribute('data-tooltip') ?? '';
			if (!title) {
				contextValue.close();
				return;
			}

			// An anchor covered by a stretched link never receives `mouseleave` itself; the link does.
			const leaveTarget = anchor.contains(target) ? anchor : target;

			const Handler = () => {
				const [state, setState] = useState(title);
				useEffect(() => {
					const close = (): void => contextValue.close();
					stashAnchorTitle(anchor, title);

					leaveTarget.addEventListener('mouseleave', close);

					const observer = new MutationObserver(() => {
						const title = anchor.getAttribute('title') ?? anchor.getAttribute('data-tooltip') ?? '';

						if (title === '') {
							return;
						}

						stashAnchorTitle(anchor, title);
						setState(title);
					});

					observer.observe(anchor, {
						attributes: true,
						attributeFilter: ['title', 'data-tooltip'],
					});

					return () => {
						leaveTarget.removeEventListener('mouseleave', close);
						// the observer must be disconnected before restoring the title, otherwise it would stash it again
						observer.disconnect();
						if (dismissedAnchor.current !== anchor) {
							restoreAnchorTitle(anchor);
						}
					};
				}, []);
				return <>{state}</>;
			};
			contextValue.open(<Handler />, anchor);
			lastLeaveTarget.current = leaveTarget;
		};

		const handleMouseOver = (e: MouseEvent): void => {
			hovered = e.target as HTMLElement;
			showTooltipAt(e);
		};

		// Moving across a stretched pseudo-element stays on the same target, so `mouseover` alone misses what is beneath it.
		const handleMouseMove = (e: MouseEvent): void => {
			if (e.target === hovered) {
				showTooltipAt(e);
			}
		};

		const dismissOnClick = (): void => {
			contextValue.dismiss();
		};

		ownerDocument.body.addEventListener('mouseover', handleMouseOver, {
			passive: true,
		});
		ownerDocument.body.addEventListener('mousemove', handleMouseMove, {
			passive: true,
		});
		ownerDocument.body.addEventListener('click', dismissOnClick, { capture: true });

		return (): void => {
			contextValue.close();
			ownerDocument.body.removeEventListener('mouseover', handleMouseOver);
			ownerDocument.body.removeEventListener('mousemove', handleMouseMove);
			ownerDocument.body.removeEventListener('click', dismissOnClick);
		};
	}, [contextValue, setTooltip, hasHover, ownerDocument]);

	return (
		<TooltipContext.Provider value={contextValue}>
			{children}
			{tooltip}
		</TooltipContext.Provider>
	);
};

export default memo<typeof TooltipProvider>(TooltipProvider);
