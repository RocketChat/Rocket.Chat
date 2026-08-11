import type { AriaDialogProps } from '@react-aria/dialog';
import { useDialog } from '@react-aria/dialog';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { useRef } from 'react';

export type UserCardDialogProps = AriaDialogProps & BoxProps;

const UserCardDialog = (props: UserCardDialogProps) => {
	const ref = useRef(null);
	const { dialogProps } = useDialog(props, ref);

	return (
		<Box
			ref={ref}
			minHeight='x214'
			rcx-user-card
			backgroundColor='surface'
			elevation='2'
			padding={24}
			display='flex'
			borderRadius='x4'
			width='439px'
			{...props}
			{...dialogProps}
		/>
	);
};

export default UserCardDialog;
