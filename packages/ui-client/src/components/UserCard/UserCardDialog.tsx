import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type UserCardDialogProps = ComponentProps<typeof Box>;

// No useDialog: it focuses the dialog on mount, and a card opened by hover must not take focus from what the user is doing.
const UserCardDialog = (props: UserCardDialogProps) => (
	<Box
		role='dialog'
		minHeight='x214'
		rcx-user-card
		backgroundColor='surface'
		elevation='2'
		padding={24}
		display='flex'
		borderRadius='medium'
		width='439px'
		{...props}
	/>
);

export default UserCardDialog;
