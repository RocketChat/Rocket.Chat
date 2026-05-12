import { Box, Icon, FramedIcon, Avatar } from '@rocket.chat/fuselage';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type CallHistoryExternalUserProps = {
	number: string;
	name?: string;
	username?: string;
	showIcon?: boolean;
};

const CallHistoryExternalUser = ({ number, name, username, showIcon = true }: CallHistoryExternalUserProps) => {
	const getUserAvatarPath = useUserAvatarPath();
	const shouldShowName = Boolean(name && name !== number);

	const avatarUrl = useMemo(() => {
		return username ? getUserAvatarPath({ username }) : undefined;
	}, [username, getUserAvatarPath]);

	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Box mie={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x28' /> : <FramedIcon icon='user' size={28} />}</Box>
			{showIcon && (
				<Box mie={8}>
					<Icon name='phone' size={20} />
				</Box>
			)}
			<Box display='flex' flexDirection='column'>
				{shouldShowName && <Box>{name}</Box>}
				<Box>{number}</Box>
			</Box>
		</Box>
	);
};

export default CallHistoryExternalUser;
