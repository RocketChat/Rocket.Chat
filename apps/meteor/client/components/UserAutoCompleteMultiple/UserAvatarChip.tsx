import { Box, Chip, Icon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';

type UserAvatarChipProps = ComponentProps<typeof Chip> & {
	federated?: boolean;
	username: string;
	name?: string;
};

const UserAvatarChip = ({ federated, username, name, ...props }: UserAvatarChipProps) => {
	return (
		<Chip height='x20' {...props}>
			{federated ? <Icon size='x20' name='globe' verticalAlign='middle' /> : <UserAvatar size='x20' username={username} />}
			<Box is='span' margin='none' mis={4} verticalAlign='middle'>
				{name ?? username}
			</Box>
		</Chip>
	);
};

export default UserAvatarChip;
