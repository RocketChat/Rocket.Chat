import { Box, Icon, Avatar, StatusBullet } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserAvatarPath, useUserPresence, useUserCard } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type CallHistoryInternalUserProps = {
	username: string;
	name?: string;
	_id: string;
};

const CallHistoryInternalUser = ({ username, name, _id }: CallHistoryInternalUserProps) => {
	const getUserAvatarPath = useUserAvatarPath();

	const avatarUrl = useMemo(() => {
		return getUserAvatarPath({ username });
	}, [username, getUserAvatarPath]);

	const displayName = useUserDisplayName({ username, name });

	const userStatus = useUserPresence(_id);

	const { triggerProps, openUserCard } = useUserCard();

	return (
		<Box display='flex' flexDirection='row' alignItems='center' role='button' onClick={(e) => openUserCard(e, username)} {...triggerProps}>
			<Box mie={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x28' /> : <Icon name='user' size='x28' />}</Box>
			<Box mie={8}>
				<StatusBullet status={userStatus?.status || 'loading'} size='small' />
			</Box>
			<Box>{displayName}</Box>
		</Box>
	);
};

export default CallHistoryInternalUser;
