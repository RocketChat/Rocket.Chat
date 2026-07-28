import type { AriaDialogProps } from '@react-aria/dialog';
import { useDialog } from '@react-aria/dialog';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useRef } from 'react';

export type UserCardDialogProps = AriaDialogProps & ComponentProps<typeof Box>;

const UserCardDialog = (props: UserCardDialogProps) => {
	const ref = useRef(null);
	const { dialogProps } = useDialog(props, ref);

	return (
		<Box
			ref={ref}
			rcx-user-card
			backgroundColor='surface'
			elevation='2'
			padding='x24'
			display='flex'
			flexDirection='column'
			borderRadius='x8'
			overflow='hidden'
			width='x400'
			{...props}
			{...dialogProps}
		/>
	);
};

export default UserCardDialog;
