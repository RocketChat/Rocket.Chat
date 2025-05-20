import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { ComponentProps, forwardRef } from 'react';

const dragHandle = css`
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
`;

const VoipPopupDragHandle = forwardRef<HTMLSpanElement, ComponentProps<typeof Box>>(function VoipPopupDragHandle(props, ref) {
	return (
		<Box
			height={20}
			bg='surface-neutral'
			display='flex'
			flexDirection='row'
			justifyContent='center'
			className={dragHandle}
			ref={ref}
			{...props}
		>
			<Icon color='info' name='stacked-meatballs' size='x20' />
		</Box>
	);
});

export default VoipPopupDragHandle;
