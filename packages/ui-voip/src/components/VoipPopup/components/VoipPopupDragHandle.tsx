import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { ComponentProps, ReactNode, forwardRef } from 'react';

const dragHandle = css`
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
`;

const VoipPopupDragHandle = forwardRef<HTMLSpanElement, { children: ReactNode } & ComponentProps<typeof Box>>(
	({ children, ...props }, ref) => {
		const isVoipDraggableEnabled = useFeaturePreview('voip-draggable');
		if (isVoipDraggableEnabled) {
			return (
				<Box ref={ref} is='span' className={dragHandle} m={0} p={0} {...props}>
					<Box height={20} display='flex' flexDirection='row' justifyContent='center'>
						{/* TODO: Using burger as a placeholder. Add the correct icon to fuselage */}
						<Icon name='burger-menu' size='x20' />
					</Box>
					{children}
				</Box>
			);
		}

		// If the feature is disabled, we need to add padding to fix the styles.
		return (
			<Box ref={ref} m={0} p={0} pbs={12} {...props}>
				{children}
			</Box>
		);
	},
);

VoipPopupDragHandle.displayName = 'VoipPopupDragHandle';

export default VoipPopupDragHandle;
