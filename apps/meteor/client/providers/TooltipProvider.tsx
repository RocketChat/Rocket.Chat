import { useDebouncedState, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { TooltipComponent } from '@rocket.chat/ui-client';
import { TooltipContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, memo, useCallback, useState } from 'react';

import TooltipPortal from '../portals/TooltipPortal';

type TooltipProviderProps = {
	children?: ReactNode;
};

const TooltipProvider = ({ children }: TooltipProviderProps) => {
	const lastAnchor = useRef<HTMLElement>();
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
				lastAnchor.current = anchor;
				previousAnchor && restoreTitle(previousAnchor);
			},
			close: (): void => {
				const previousAnchor = lastAnchor.current;
				setTooltip(null);
				setTooltip.flush();
				lastAnchor.current = undefined;
				previousAnchor && restoreTitle(previousAnchor);
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

		document.body.addEventListener('mouseover', handleMouseOver, {
			passive: true,
		});
		document.body.addEventListener('click', dismissOnClick, { capture: true });

		return (): void => {
			contextValue.close();
			document.body.removeEventListener('mouseover', handleMouseOver);
			document.body.removeEventListener('click', dismissOnClick);
		};
	}, [contextValue, setTooltip, hasHover]);

	return (
		<TooltipContext.Provider value={contextValue}>
			{children}
			{tooltip && <TooltipPortal>{tooltip}</TooltipPortal>}
		</TooltipContext.Provider>
	);
};

export default memo<typeof TooltipProvider>(TooltipProvider);
