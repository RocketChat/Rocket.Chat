import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';

const anon = {
	_id: '',
	username: 'Anonymous',
	status: 'online',
	statusText: '',
	avatarETag: undefined,
} as const;

/**
 * @deprecated Feature preview
 * @description Should be moved to the core when the feature is ready
 * @memberof navigationBar
 */

const UserAvatarWithStatus = () => {
	const user = useUser();
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');

	const { status = !user ? 'online' : 'offline', username, avatarETag, statusText } = user || anon;

	return (
		<Box
			position='relative'
			className={css`
				cursor: pointer;
			`}
			aria-label='User menu'
			data-qa='sidebar-avatar-button'
		>
			{username && <UserAvatar size='x24' username={username} etag={avatarETag} />}
			<Box
				className={css`
					bottom: 0;
					right: 0;
				`}
				justifyContent='center'
				alignItems='center'
				display='flex'
				overflow='hidden'
				size='x12'
				borderWidth='default'
				position='absolute'
				bg='surface-tint'
				borderColor='extra-light'
				borderRadius='full'
				mie='neg-x2'
				mbe='neg-x2'
			>
				<UserStatus small status={presenceDisabled ? 'disabled' : status} statusText={statusText} />
			</Box>
		</Box>
	);
};

export default UserAvatarWithStatus;
