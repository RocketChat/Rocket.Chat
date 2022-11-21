import { Box, PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import React, { RefObject, useRef, useState, ReactElement } from 'react';

type TooltipOnHoverProps = {
	element: ReactElement;
	tooltip: ReactElement;
};

export const TooltipOnHover = ({ element, tooltip }: TooltipOnHoverProps): ReactElement => {
	const ref: RefObject<Element> = useRef(null);
	const [isHovered, setIsHovered] = useState(false);

	return (
		<>
			<Box is='span' ref={ref} onMouseEnter={(): void => setIsHovered(true)} onMouseLeave={(): void => setIsHovered(false)}>
				{element}
			</Box>

			<PositionAnimated
				anchor={ref}
				placement='top-middle'
				margin={8}
				visible={isHovered ? AnimatedVisibility.VISIBLE : AnimatedVisibility.HIDDEN}
			>
				{tooltip}
			</PositionAnimated>
		</>
	);
};
