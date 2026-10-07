import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { HoverCard } from '../HoverCard';

export type UserCardDialogProps = ComponentProps<typeof Box>;

const UserCardDialog = ({ 'aria-label': ariaLabel, ...props }: UserCardDialogProps) => (
	<HoverCard aria-label={ariaLabel} width='439px'>
		<Box rcx-user-card minHeight='x214' padding={24} display='flex' {...props} />
	</HoverCard>
);

export default UserCardDialog;
