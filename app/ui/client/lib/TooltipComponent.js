import React, { useRef } from 'react';
import { Tooltip, PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';

export const TooltipComponent = ({ title, anchor }) => {
	const ref = useRef(anchor);

	return <PositionAnimated
		anchor={ref}
		placement='top-middle'
		margin={8}
		visible={window.matchMedia('(max-width: 500px)').matches ? AnimatedVisibility.HIDDEN : AnimatedVisibility.UNHIDING}
		children={title}
	><Tooltip>{title}</Tooltip></PositionAnimated>;
};

export default TooltipComponent;
