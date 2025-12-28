import type { IVideoConferenceUser, Serialized } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { useSetting, useUserAvatarPath, useUserPreference } from '@rocket.chat/ui-contexts';
import { memo, type ReactElement } from 'react';

const MAX_USERS = 3;

type VideoConfMessageUserStackProps = {
	users: Serialized<IVideoConferenceUser>[];
};

const VideoConfMessageUserStack = ({ users }: VideoConfMessageUserStackProps): ReactElement => {
	const displayAvatars = useUserPreference<boolean>('displayAvatars');
	const showRealName = useSetting('UI_Use_Real_Name', false);
	const getUserAvatarPath = useUserAvatarPath();

	return (
		<Box mi={4}>
			{displayAvatars && (
				<Box display='flex' alignItems='center' mi='neg-x2'>
					{users.slice(0, MAX_USERS).map(({ name, username }, index) => (
						<Box mi={2} key={index}>
							<Avatar
								size='x28'
								alt={username || ''}
								title={getUserDisplayName(name, username, showRealName)}
								url={getUserAvatarPath(username)}
							/>
						</Box>
					))}
				</Box>
			)}
			{!displayAvatars && <Icon size='x20' name='user' />}
		</Box>
	);
};

export default memo(VideoConfMessageUserStack);
