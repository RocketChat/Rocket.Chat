import { Box, Tooltip, PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useRef } from 'react';

export const RC_PORTAL_TOOLTIP_ATTR = 'data-rc-portal-tooltip';

export const RC_PORTAL_TOOLTIP_SELECTOR = `[${RC_PORTAL_TOOLTIP_ATTR}]`;

type TooltipComponentProps = {
	title: ReactNode;
	anchor: Element;
};

export const TooltipComponent = ({ title, anchor }: TooltipComponentProps) => {
	const ref = useRef(anchor);

	return (
		<PositionAnimated anchor={ref} placement='top-middle' margin={8} visible={AnimatedVisibility.UNHIDING}>
			<Box
				{...{ [RC_PORTAL_TOOLTIP_ATTR]: '' }}
				display='inline-block'
				maxWidth='100%'
				style={{ pointerEvents: 'auto' }}
			>
				<Tooltip role='tooltip'>{title}</Tooltip>
			</Box>
		</PositionAnimated>
	);
};
