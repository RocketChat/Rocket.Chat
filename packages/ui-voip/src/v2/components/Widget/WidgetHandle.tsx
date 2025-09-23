import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { ComponentProps } from 'react';

import { useDraggableWidget } from './WidgetDraggableContext';

const dragHandle = css`
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
`;

const WidgetHandle = (props: ComponentProps<typeof Box>) => {
	const { handleRef } = useDraggableWidget();
	return (
		<Box
			height={20}
			bg='surface-tint'
			display='flex'
			flexDirection='row'
			justifyContent='center'
			className={dragHandle}
			ref={handleRef}
			{...props}
		>
			<Icon color='info' name='stacked-meatballs' size='x20' />
		</Box>
	);
};

export default WidgetHandle;
