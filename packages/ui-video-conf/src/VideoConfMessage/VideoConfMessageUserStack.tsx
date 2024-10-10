import type { IVideoConferenceUser, Serialized } from '@rocket.chat/core-typings';
import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { ReactElement, memo } from 'react';

const MAX_USERS = 3;

type VideoConfMessageUserStackProps = {
	users: Serialized<IVideoConferenceUser>[];
	displayAvatars?: boolean;
	showRealName?: boolean;
};

const VideoConfMessageUserStack = ({ users, showRealName, displayAvatars = true }: VideoConfMessageUserStackProps): ReactElement => {
	const getUserAvatarPath = useUserAvatarPath();
	const usersTooltip = users.map(({ name, username }) => (showRealName ? name : username)).join(', ');

	return (
		<Box mi={4}>
			{displayAvatars && (
				<Box display='flex' alignItems='center' mi='neg-x2'>
					{users.slice(0, MAX_USERS).map(({ name, username }, index) => (
						<Box mi={2} key={index}>
							<Avatar size='x28' alt={username || ''} title={showRealName ? name : username} url={getUserAvatarPath(username as string)} />
						</Box>
					))}
				</Box>
			)}
			{!displayAvatars && <Icon size='x20' title={usersTooltip} name='user' />}
		</Box>
	);
};

export default memo(VideoConfMessageUserStack);
