import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react';
import { forwardRef } from 'react';

import { UserStatus } from '../../../components/UserStatus';

const anon = {
	_id: '',
	username: 'Anonymous',
	status: 'online',
	avatarETag: undefined,
} as const;

export type UserMenuButtonProps = ComponentPropsWithoutRef<typeof IconButton>;

const UserMenuButton = forwardRef(function UserMenuButton(props: UserMenuButtonProps, ref: ForwardedRef<HTMLElement>) {
	const user = useUser();

	const { status = !user ? 'online' : 'offline', username, avatarETag } = user || anon;
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const userStatusEnabled = useSetting('Accounts_UserStatus_Enabled', true);
	const adminStatusHidingEnabled = useSetting('Accounts_StatusVisibility_Admin_Enabled', false);

	const getDisplayedStatus = () => {
		if (!userStatusEnabled || (adminStatusHidingEnabled && user?.presenceDisabledByAdmin)) {
			return 'offline';
		}

		return presenceDisabled ? 'disabled' : status;
	};

	return (
		<IconButton
			{...props}
			ref={ref}
			icon={username ? <UserAvatar size='x28' username={username} etag={avatarETag} /> : 'user'}
			badgePosition='bottom-end'
			badge={
				<Box
					display='flex'
					justifyContent='center'
					alignItems='center'
					overflow='hidden'
					size='x12'
					borderWidth='default'
					backgroundColor='surface-tint'
					borderColor='extra-light'
					borderRadius='full'
				>
					<UserStatus small status={getDisplayedStatus()} />
				</Box>
			}
		/>
	);
});

export default UserMenuButton;
