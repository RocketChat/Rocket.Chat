import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useDraggableWidget } from './WidgetDraggableContext';

const dragHandle = css`
	cursor: grab;

	background-color: ${Palette.surface['surface-tint'].toString()};
	color: ${Palette.text['font-default'].toString()};

	&:hover {
		background-color: ${Palette.surface['surface-neutral'].toString()};
		color: ${Palette.text['font-info'].toString()};
	}
	&:active {
		cursor: grabbing;
	}
`;

const WidgetHandle = (props: ComponentProps<typeof Box>) => {
	const { handleRef } = useDraggableWidget();
	return (
		<Box height={20} display='flex' flexDirection='row' justifyContent='center' className={dragHandle} ref={handleRef} {...props}>
			<Icon name='stacked-meatballs' size='x20' />
		</Box>
	);
};

export default WidgetHandle;
