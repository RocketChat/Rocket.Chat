import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type RoomHoverCardDialogProps = ComponentProps<typeof Box>;

// No useDialog: it focuses the dialog on mount, and a card opened by hover must not take focus from the room list.
const RoomHoverCardDialog = (props: RoomHoverCardDialogProps) => (
	<Box
		role='dialog'
		rcx-room-hover-card
		width='x372'
		display='flex'
		flexDirection='column'
		overflow='hidden'
		backgroundColor='surface-light'
		borderWidth='default'
		borderColor='stroke-extra-light'
		borderRadius='medium'
		elevation='2'
		{...props}
	/>
);

export default RoomHoverCardDialog;
