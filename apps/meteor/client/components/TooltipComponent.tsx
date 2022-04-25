import { Tooltip, PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import React, { ReactElement, ReactNode, useRef } from 'react';

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

export default TooltipComponent;
