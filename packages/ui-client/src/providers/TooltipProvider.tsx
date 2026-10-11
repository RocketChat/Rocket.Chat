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

const TooltipProvider = ({ children, ownerDocument = window.document }: TooltipProviderProps) => {
	const lastAnchor = useRef<HTMLElement>(undefined);
	const dismissedAnchor = useRef<HTMLElement>(undefined);
	const hasHover = !useMediaQuery('(hover: none)');

	const [tooltip, setTooltip] = useDebouncedState<ReactNode>(null, 300);

	const contextValue = useMemo(
		() => ({
			open: (tooltip: ReactNode, anchor: HTMLElement): void => {
				setTooltip(<TooltipComponent key={new Date().toISOString()} title={tooltip} anchor={anchor} />);
				lastAnchor.current = anchor;
			},
			close: (): void => {
				setTooltip(null);
				setTooltip.flush();
				lastAnchor.current = undefined;
			},
			dismiss: (): void => {
				const anchor = lastAnchor.current;
				setTooltip(null);
				setTooltip.flush();

				if (anchor) {
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
					anchor.addEventListener('mouseleave', restoreOnLeave, { once: true });
				}
			},
		}),
		[setTooltip],
	);

	useEffect(() => {
		if (!hasHover) {
			return;
		}

		const handleMouseOver = (e: MouseEvent): void => {
			const target = e.target as HTMLElement;
			if (lastAnchor.current === target) {
				return;
			}

			const anchor = target.closest('[title], [data-tooltip]') as HTMLElement;

			if (lastAnchor.current === anchor) {
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

			// eslint-disable-next-line react/no-multi-comp
			const Handler = () => {
				const [state, setState] = useState(title);
				useEffect(() => {
					const close = (): void => contextValue.close();
					stashAnchorTitle(anchor, title);

					anchor.addEventListener('mouseleave', close);

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
						anchor.removeEventListener('mouseleave', close);
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
		};

		const dismissOnClick = (): void => {
			contextValue.dismiss();
		};

		ownerDocument.body.addEventListener('mouseover', handleMouseOver, {
			passive: true,
		});
		ownerDocument.body.addEventListener('click', dismissOnClick, { capture: true });

		return (): void => {
			contextValue.close();
			ownerDocument.body.removeEventListener('mouseover', handleMouseOver);
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
