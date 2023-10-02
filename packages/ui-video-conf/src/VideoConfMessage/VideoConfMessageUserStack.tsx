import type { IVideoConferenceUser, Serialized } from '@rocket.chat/core-typings';
import { Avatar, Box } from '@rocket.chat/fuselage';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { ReactElement, memo } from 'react';

const MAX_USERS = 3;

const VideoConfMessageUserStack = ({ users }: { users: Serialized<IVideoConferenceUser>[] }): ReactElement => {
	const getUserAvatarPath = useUserAvatarPath();

	return (
		<Box mi={4}>
			<Box display='flex' alignItems='center' mi='neg-x2'>
				{users.slice(0, MAX_USERS).map(({ username }, index) => (
					<Box mi={2} key={index}>
						<Avatar size='x28' data-tooltip={username} url={getUserAvatarPath(username as string)} />
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default memo(VideoConfMessageUserStack);
