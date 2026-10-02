import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type UserCardDialogProps = ComponentProps<typeof Box>;

// No useDialog: it focuses the dialog on mount, and a card opened by hover must not take focus from what the user is doing.
const UserCardDialog = (props: UserCardDialogProps) => (
	<Box
		role='dialog'
		rcx-user-card
		backgroundColor='surface'
		elevation='2'
		paddingBlockStart='x24'
		paddingBlockEnd='x16'
		paddingInline='x16'
		display='flex'
		flexDirection='column'
		borderRadius='large'
		overflow='hidden'
		width='x400'
		{...props}
	/>
);

export default UserCardDialog;
