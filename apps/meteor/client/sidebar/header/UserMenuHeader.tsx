import type { IUser } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import MarkdownText from '../../components/MarkdownText';
import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';

const UserMenuHeader = ({ user }: { user: IUser }) => {
	const t = useTranslation();
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');
	const displayName = useUserDisplayName(user);

	return (
		<Box display='flex' flexDirection='row' alignItems='center' minWidth='x208' mbe='neg-x4' mbs='neg-x8'>
			<Box mie={4}>
				<UserAvatar size='x36' username={user?.username || ''} etag={user?.avatarETag} />
			</Box>
			<Box mis={4} display='flex' overflow='hidden' flexDirection='column' fontScale='p2' mb='neg-x4' flexGrow={1} flexShrink={1}>
				<Box withTruncatedText w='full' display='flex' alignItems='center' flexDirection='row'>
					<Margins inline={4}>
						<UserStatus status={presenceDisabled ? 'disabled' : user.status} />
						<Box is='span' withTruncatedText display='inline-block' fontWeight='700'>
							{displayName}
						</Box>
					</Margins>
				</Box>
				<Box color='hint'>
					<MarkdownText
						withTruncatedText
						parseEmoji={true}
						content={user?.statusText || t(user?.status ?? 'offline')}
						variant='inlineWithoutBreaks'
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default UserMenuHeader;
