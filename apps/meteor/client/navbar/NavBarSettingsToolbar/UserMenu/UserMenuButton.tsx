import { VisuallyHidden } from '@react-aria/visually-hidden';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react';
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserStatus } from '../../../components/UserStatus';

const anon = {
	_id: '',
	username: 'Anonymous',
	status: 'online',
	avatarETag: undefined,
} as const;

const statusLabels = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline',
	disabled: 'User_status_disabled',
} as const;

export type UserMenuButtonProps = ComponentPropsWithoutRef<typeof IconButton>;

const UserMenuButton = forwardRef(function UserMenuButton(props: UserMenuButtonProps, ref: ForwardedRef<HTMLElement>) {
	const { t } = useTranslation();
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

	const displayedStatus = getDisplayedStatus();
	const statusLabel = t(statusLabels[displayedStatus as keyof typeof statusLabels] ?? 'Loading');
	const descriptionId = useId();

	// Announces status changes only, never the status the page loaded with.
	const [announcement, setAnnouncement] = useState('');
	const previousStatusLabel = useRef(statusLabel);
	useEffect(() => {
		if (previousStatusLabel.current === statusLabel) {
			return;
		}
		previousStatusLabel.current = statusLabel;
		setAnnouncement(statusLabel);
	}, [statusLabel]);

	return (
		<>
			<IconButton
				{...props}
				ref={ref}
				aria-describedby={descriptionId}
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
						<UserStatus small status={displayedStatus} />
					</Box>
				}
			/>
			<VisuallyHidden id={descriptionId}>{statusLabel}</VisuallyHidden>
			<VisuallyHidden role='status'>{announcement}</VisuallyHidden>
		</>
	);
});

export default UserMenuButton;
