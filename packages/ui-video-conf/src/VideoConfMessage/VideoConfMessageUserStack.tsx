import type { ISetting, IVideoConferenceUser, Serialized } from '@rocket.chat/core-typings';
import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { memo, type ReactElement } from 'react';

const MAX_USERS = 3;

type VideoConfMessageUserStackProps = {
	users: Serialized<IVideoConferenceUser>[];
	displayAvatars?: boolean;
	iconTitle?: string;
	showRealName?: ISetting['value'];
};

const VideoConfMessageUserStack = ({ users, showRealName, iconTitle, displayAvatars }: VideoConfMessageUserStackProps): ReactElement => {
	const getUserAvatarPath = useUserAvatarPath();

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
			{!displayAvatars && <Icon size='x20' title={iconTitle} name='user' />}
		</Box>
	);
};

export default memo(VideoConfMessageUserStack);
