import { useDebouncedState, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { TooltipComponent } from '@rocket.chat/ui-client';
import { TooltipContext } from '@rocket.chat/ui-contexts';
import type { FC, ReactNode } from 'react';
import React, { useEffect, useMemo, useRef, memo, useCallback } from 'react';

import TooltipPortal from '../components/TooltipPortal';

const TooltipProvider: FC = ({ children }) => {
	const lastAnchor = useRef<HTMLElement>();
	const hasHover = !useMediaQuery('(hover: none)');

	const [tooltip, setTooltip] = useDebouncedState<ReactNode>(null, 300);

	const restoreTitle = useCallback((): void => {
		const previousAnchor = lastAnchor.current;
		// restore the title attribute when the mouse leaves the anchor
		if (previousAnchor && !previousAnchor.getAttribute('title')) {
			previousAnchor.setAttribute('title', previousAnchor.getAttribute('data-title') || '');
		}
	}, []);

	const contextValue = useMemo(
		() => ({
			open: (tooltip: ReactNode, anchor: HTMLElement): void => {
				restoreTitle();
				lastAnchor.current = anchor;
				setTooltip(<TooltipComponent key={new Date().toISOString()} title={tooltip} anchor={anchor} />);
			},
			close: (): void => {
				setTooltip(null);
				setTooltip.flush();
				restoreTitle();
				lastAnchor.current = undefined;
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
				useEffect(() => {
					const close = (): void => contextValue.close();
					// store the title in a data attribute
					anchor.setAttribute('data-title', title);
					// Removes the title attribute to prevent the browser's tooltip from showing
					anchor.setAttribute('title', '');

					anchor.addEventListener('mouseleave', close);

					return () => {
						anchor.removeEventListener('mouseleave', close);
					};
				}, []);
				return <>{title}</>;
			};
			contextValue.open(<Handler />, anchor);
		};

		const dismissOnClick = (): void => {
			contextValue.dismiss();
		};

		document.body.addEventListener('mouseover', handleMouseOver);
		document.body.addEventListener('click', dismissOnClick);

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
