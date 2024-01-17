import { Tooltip, PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { useRef } from 'react';

type TooltipComponentProps = {
	title: ReactNode;
	anchor: Element;
};

export const TooltipComponent = ({ title, anchor }: TooltipComponentProps): ReactElement => {
	const ref = useRef(anchor);

	return (
		<PositionAnimated anchor={ref} placement='top-middle' margin={8} visible={AnimatedVisibility.UNHIDING}>
			<Tooltip>{title}</Tooltip>
		</PositionAnimated>
	);
};
