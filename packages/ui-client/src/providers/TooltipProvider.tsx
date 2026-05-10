import { useDebouncedState, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { TooltipContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, memo, useCallback, useState } from 'react';

import { TooltipComponent, RC_PORTAL_TOOLTIP_SELECTOR } from '../components/TooltipComponent';
import TooltipPortal, { TOOLTIP_PORTAL_ROOT_ID } from '../portals/TooltipPortal';

type TooltipProviderProps = {
	children?: ReactNode;
	ownerDocument?: Document;
};

const resolveMouseEventTarget = (raw: EventTarget | null): HTMLElement | null => {
	if (!raw) {
		return null;
	}
	if (raw instanceof HTMLElement) {
		return raw;
	}
	if (raw instanceof Text) {
		return raw.parentElement;
	}
	return null;
};

const TooltipProvider = ({ children, ownerDocument = window.document }: TooltipProviderProps) => {
	const lastAnchor = useRef<HTMLElement>();
	const gapCloseTimerRef = useRef<ReturnType<typeof setTimeout>>();
	const hasHover = !useMediaQuery('(hover: none)');

	const [tooltip, setTooltip] = useDebouncedState<ReactNode>(null, 300);

	const restoreTitle = useCallback((previousAnchor: HTMLElement | undefined): void => {
		setTimeout(() => {
			if (previousAnchor && !previousAnchor.getAttribute('title')) {
				previousAnchor.setAttribute('title', previousAnchor.getAttribute('data-title') ?? '');
				previousAnchor.removeAttribute('data-title');
			}
		}, 0);
	}, []);

	const contextValue = useMemo(
		() => ({
			open: (tooltip: ReactNode, anchor: HTMLElement): void => {
				const previousAnchor = lastAnchor.current;
				setTooltip(<TooltipComponent key={new Date().toISOString()} title={tooltip} anchor={anchor} />);
				// Opening must not be debounced: custom tooltips use a 300ms debounced state, but the
				// document mouseover handler uses a shorter gap timer before close — without flush the
				// portal is not in the DOM yet, so hover cannot cancel the scheduled close.
				setTooltip.flush();
				lastAnchor.current = anchor;
				if (previousAnchor) {
					restoreTitle(previousAnchor);
				}
			},
			close: (): void => {
				const previousAnchor = lastAnchor.current;
				setTooltip(null);
				setTooltip.flush();
				lastAnchor.current = undefined;
				if (previousAnchor) {
					restoreTitle(previousAnchor);
				}
			},
			dismiss: (): void => {
				setTooltip(null);
				setTooltip.flush();
			},
		}),
		[setTooltip, restoreTitle],
	);

	useEffect(() => {
		if (!hasHover) {
			return;
		}

		const cancelGapCloseTimer = (): void => {
			if (gapCloseTimerRef.current !== undefined) {
				clearTimeout(gapCloseTimerRef.current);
				gapCloseTimerRef.current = undefined;
			}
		};

		const handleMouseOver = (e: MouseEvent): void => {
			const target = resolveMouseEventTarget(e.target);
			if (!target) {
				return;
			}

			const tooltipPortalRoot = document.getElementById(TOOLTIP_PORTAL_ROOT_ID);

			// Still inside the anchor subtree for the currently open custom tooltip (read count,
			// reactions, etc.). Must run before `[data-tooltip]` logic — empty `data-tooltip=""`
			// otherwise triggers an immediate close.
			if (lastAnchor.current?.contains(target)) {
				cancelGapCloseTimer();
				return;
			}

			// Inside the tooltip portal (bubble or gap-friendly hit-testing): keep custom tooltip.
			if (tooltipPortalRoot?.contains(target)) {
				cancelGapCloseTimer();
				return;
			}

			// Custom tooltips opened via TooltipContext.open() render in a portal. The global
			// handler below only understands `[title]` / `[data-tooltip]` anchors; without these
			// guards, hovering the portaled bubble closes the tooltip (no matching anchor).
			if (target.closest(RC_PORTAL_TOOLTIP_SELECTOR) || target.closest('[role="tooltip"]')) {
				cancelGapCloseTimer();
				return;
			}

			if (lastAnchor.current === target) {
				cancelGapCloseTimer();
				return;
			}

			const anchor = target.closest('[title], [data-tooltip]') as HTMLElement;

			if (lastAnchor.current === anchor) {
				cancelGapCloseTimer();
				return;
			}

			if (!anchor) {
				cancelGapCloseTimer();
				gapCloseTimerRef.current = setTimeout(() => {
					contextValue.close();
					gapCloseTimerRef.current = undefined;
				}, 450);
				return;
			}

			const title = anchor.getAttribute('title') ?? anchor.getAttribute('data-tooltip') ?? '';
			if (!title) {
				cancelGapCloseTimer();
				if (lastAnchor.current === anchor) {
					return;
				}
				contextValue.close();
				return;
			}

			cancelGapCloseTimer();

			// eslint-disable-next-line react/no-multi-comp
			const Handler = () => {
				const [state, setState] = useState(title);
				useEffect(() => {
					const close = (): void => contextValue.close();
					// store the title in a data attribute
					anchor.setAttribute('data-title', title);
					// Removes the title attribute to prevent the browser's tooltip from showing
					anchor.setAttribute('title', '');

					anchor.addEventListener('mouseleave', close);

					const observer = new MutationObserver(() => {
						const title = anchor.getAttribute('title') ?? anchor.getAttribute('data-tooltip') ?? '';

						if (title === '') {
							return;
						}

						// store the title in a data attribute
						anchor.setAttribute('data-title', title);
						// Removes the title attribute to prevent the browser's tooltip from showing
						anchor.setAttribute('title', '');

						setState(title);
					});

					observer.observe(anchor, {
						attributes: true,
						attributeFilter: ['title', 'data-tooltip'],
					});

					return () => {
						anchor.removeEventListener('mouseleave', close);
						observer.disconnect();
					};
				}, []);
				return <>{state}</>;
			};
			contextValue.open(<Handler />, anchor);
		};

		const dismissOnClick = (): void => {
			contextValue.dismiss();
		};

		ownerDocument.body.addEventListener('mouseover', handleMouseOver, {
			passive: true,
		});
		ownerDocument.body.addEventListener('click', dismissOnClick, { capture: true });

		return (): void => {
			if (gapCloseTimerRef.current !== undefined) {
				clearTimeout(gapCloseTimerRef.current);
				gapCloseTimerRef.current = undefined;
			}
			contextValue.close();
			ownerDocument.body.removeEventListener('mouseover', handleMouseOver);
			ownerDocument.body.removeEventListener('click', dismissOnClick);
		};
	}, [contextValue, setTooltip, hasHover, ownerDocument]);

	return (
		<TooltipContext.Provider value={contextValue}>
			{children}
			{tooltip && <TooltipPortal>{tooltip}</TooltipPortal>}
		</TooltipContext.Provider>
	);
};

export default memo<typeof TooltipProvider>(TooltipProvider);
