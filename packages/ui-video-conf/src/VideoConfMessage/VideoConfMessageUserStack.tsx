import type { IVideoConferenceUser, Serialized } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

const MAX_USERS = 3;

export type VideoConfMessageUserStackProps = {
	users: Serialized<IVideoConferenceUser>[];
	showAvatars: boolean;
	showRealName: boolean;
};

const VideoConfMessageUserStack = ({ users, showAvatars, showRealName }: VideoConfMessageUserStackProps) => {
	const getUserAvatarPath = useUserAvatarPath();

	return (
		<Box>
			{showAvatars && (
				<Box display='flex' alignItems='center' gap='x4'>
					{users.slice(0, MAX_USERS).map(({ name, username }, index) => (
						<Avatar
							key={index}
							size='x28'
							alt={username || ''}
							title={getUserDisplayName(name, username, showRealName)}
							url={getUserAvatarPath(username)}
						/>
					))}
				</Box>
			)}
			{!showAvatars && <Icon size='x20' name='user' />}
		</Box>
	);
};

export default memo(VideoConfMessageUserStack);
