import type { AriaDialogProps } from '@react-aria/dialog';
import { useDialog } from '@react-aria/dialog';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useRef } from 'react';

type UserCardDialogProps = AriaDialogProps & ComponentProps<typeof Box>;

const UserCardDialog = (props: UserCardDialogProps) => {
	const ref = useRef(null);
	const { dialogProps } = useDialog(props, ref);

	return (
		<Box
			ref={ref}
			minHeight='x214'
			rcx-user-card
			bg='surface'
			elevation='2'
			p={24}
			display='flex'
			borderRadius='x4'
			width='439px'
			{...props}
			{...dialogProps}
		/>
	);
};

export default UserCardDialog;
