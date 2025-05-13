import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { ComponentProps, forwardRef } from 'react';

const dragHandle = css`
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
`;

const VoipPopupDragHandle = forwardRef<HTMLSpanElement, ComponentProps<typeof Box>>((props, ref) => {
	return (
		<Box height={20} display='flex' flexDirection='row' justifyContent='center' className={dragHandle} ref={ref} {...props}>
			{/* TODO: Using burger as a placeholder. Add the correct icon to fuselage */}
			<Icon name='burger-menu' size='x20' />
		</Box>
	);
});

VoipPopupDragHandle.displayName = 'VoipPopupDragHandle';

export default VoipPopupDragHandle;
