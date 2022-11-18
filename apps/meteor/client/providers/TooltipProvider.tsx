import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { TooltipComponent } from '@rocket.chat/ui-client';
import { TooltipContext } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect, useState, useMemo, ReactNode, useRef, memo } from 'react';

import TooltipPortal from '../components/TooltipPortal';

const TooltipProvider: FC = ({ children }) => {
	const lastAnchor = useRef<HTMLElement>();
	const hasHover = !useMediaQuery('(hover: none)');

	const [tooltip, setTooltip] = useState<ReactNode>(null);

	useEffect(() => {
		if (!hasHover) {
			return;
		}
		let timeout: ReturnType<typeof setTimeout> | undefined;

		const handleMouseOver = (e: MouseEvent): void => {
			const target = e.target as HTMLElement;
			const anchor = target.title || target.dataset?.tooltip ? target : (target.closest('[title], [data-tooltip]') as HTMLElement);
			if (lastAnchor.current === anchor) {
				return;
			}

			if (timeout) {
				clearTimeout(timeout);
			}
			lastAnchor.current = undefined;

			timeout = setTimeout(() => {
				if (!anchor) {
					return;
				}
				const title = anchor.getAttribute('title') || anchor.getAttribute('data-tooltip');
				if (!title) {
					anchor.removeAttribute('data-title');
					return;
				}
				anchor.setAttribute('data-title', title);
				anchor.setAttribute('data-tooltip', title);
				anchor.removeAttribute('title');
				lastAnchor.current = anchor;
				setTooltip(<TooltipComponent title={title} anchor={anchor} />);
			}, 300);
			setTooltip(null);
		};

		const handleClick = (): void => {
			setTooltip(null);
			clearTimeout(timeout);
		};

		document.body.addEventListener('mouseover', handleMouseOver);
		document.body.addEventListener('click', handleClick);

		return (): void => {
			if (timeout) {
				clearTimeout(timeout);
			}
			document.body.removeEventListener('mouseover', handleMouseOver);
			document.body.removeEventListener('click', handleClick);
		};
	}, [hasHover]);

	const contextValue = useMemo(
		() => ({
			open: (tooltip: ReactNode, anchor: HTMLElement): void => {
				setTooltip(<TooltipComponent title={tooltip} anchor={anchor} />);
			},
			close: (): void => {
				setTooltip(null);
			},
		}),
		[],
	);

	return (
		<TooltipContext.Provider value={contextValue}>
			{children}
			{tooltip && <TooltipPortal>{tooltip}</TooltipPortal>}
		</TooltipContext.Provider>
	);
};

export default memo<typeof TooltipProvider>(TooltipProvider);
