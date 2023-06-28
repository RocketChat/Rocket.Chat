import type { IUser } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenuItem';
import MarkdownText from '../../../components/MarkdownText';
import { UserStatus } from '../../../components/UserStatus';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';

export const useUserStatusItem = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const user = useUser() as IUser;
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');
	const displayName = useUserDisplayName(user);

	const handleCustomStatus = useCustomStatusModalHandler();

	return [
		{
			id: 'user-status',
			disabled: presenceDisabled,
			content: (
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Box mie='x4'>
						<UserAvatar size='x36' username={user?.username || ''} etag={user?.avatarETag} />
					</Box>
					<Box mis='x4' display='flex' overflow='hidden' flexDirection='column' fontScale='p2' mb='neg-x4' flexGrow={1} flexShrink={1}>
						<Box withTruncatedText w='full' display='flex' alignItems='center' flexDirection='row'>
							<Margins inline='x4'>
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
			),
			onClick: handleCustomStatus,
		},
	];
};
