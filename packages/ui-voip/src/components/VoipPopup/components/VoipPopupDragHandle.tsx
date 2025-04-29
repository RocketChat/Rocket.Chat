import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { ComponentProps, forwardRef } from 'react';

const dragHandle = css`
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
`;

const VoipPopupDragHandle = forwardRef<HTMLSpanElement, ComponentProps<typeof Box>>((props, ref) => {
	const voipDraggableEnabled = useFeaturePreview('voip-draggable');
	if (!voipDraggableEnabled) {
		return (
			<Box height={20} display='flex' flexDirection='row' justifyContent='center' className={dragHandle} ref={ref} {...props}>
				{/* TODO: Using burger as a placeholder. Add the correct icon to fuselage */}
				<Icon name='burger-menu' size='x20' />
			</Box>
		);
	}

	// If the feature is disabled, we need to add padding to fix the header styles.
	return <Box ref={ref} m={0} p={0} pbs={12} aria-hidden='true' {...props} />;
});

VoipPopupDragHandle.displayName = 'VoipPopupDragHandle';

export default VoipPopupDragHandle;
