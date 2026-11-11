import { Box, Chip, Icon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

export type UserAvatarChipProps = ComponentProps<typeof Chip> & {
	federated?: boolean;
	username: string;
	name?: string;
};

const UserAvatarChip = ({ federated, username, name, ...props }: UserAvatarChipProps) => {
	const displayName = useUserDisplayName({ name, username });
	return (
		<Chip {...props}>
			<Box is='span' display='flex' alignItems='center' gap={4} margin='none'>
				{federated ? <Icon size='x20' name='globe' /> : <UserAvatar size='x20' username={username} />}
				{displayName}
			</Box>
		</Chip>
	);
};

export default UserAvatarChip;
