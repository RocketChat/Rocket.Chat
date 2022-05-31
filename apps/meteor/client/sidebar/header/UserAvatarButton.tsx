import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Dropdown } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import React, { memo, useRef, ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import UserDropdown from './UserDropdown';
import { useDropdownVisibility } from './hooks/useDropdownVisibility';

const UserAvatarButton = function UserAvatarButton(): ReactElement {
	const user = useUser() as Required<IUser> | undefined;
	const {
		status = !user ? 'online' : 'offline',
		username,
		avatarETag,
		statusText,
	} = user || {
		_id: '',
		username: 'Anonymous',
		status: 'online',
		statusText: '',
	};

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
				<UserAvatar size='x24' username={username} etag={avatarETag} />
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
					borderWidth='x2'
					position='absolute'
					bg='neutral-200'
					borderColor='neutral-200'
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
