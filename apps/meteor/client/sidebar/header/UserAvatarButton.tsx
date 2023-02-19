import { css } from '@rocket.chat/css-in-js';
import { Box, Dropdown } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useRef } from 'react';
import { createPortal } from 'react-dom';

import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import UserDropdown from './UserDropdown';
import { useDropdownVisibility } from './hooks/useDropdownVisibility';

const anon = {
	_id: '',
	username: 'Anonymous',
	status: 'online',
	statusText: '',
	avatarETag: undefined,
} as const;

const UserAvatarButton = (): ReactElement => {
	const user = useUser();

	const { status = !user ? 'online' : 'offline', username, avatarETag, statusText } = user || anon;

	// const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	return (
		<>
			<Box
				position='relative'
				ref={reference}
				onClick={(): void => toggle()}
				className={css`
					cursor: pointer;
				`}
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
					size={12}
					borderWidth='default'
					position='absolute'
					bg='surface-tint'
					borderColor='extra-light'
					borderRadius='full'
					mie='neg-x2'
					mbe='neg-x2'
				>
					<UserStatus small status={status} statusText={statusText} />
				</Box>
			</Box>
			{user &&
				isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						<UserDropdown user={user} onClose={(): void => toggle(false)} />
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default memo(UserAvatarButton);
