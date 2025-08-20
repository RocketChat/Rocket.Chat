import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { ComponentProps, forwardRef } from 'react';

const dragHandle = css`
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
`;

const WidgetHandle = forwardRef<HTMLSpanElement, ComponentProps<typeof Box>>(function WidgetHandle(props, ref) {
	return (
		<Box
			height={20}
			bg='surface-tint'
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

export default WidgetHandle;
