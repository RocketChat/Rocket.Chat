import type { IUser } from '@rocket.chat/core-typings';
import { Icon, Tag, Skeleton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserInfoQuery } from '../../../../hooks/useUserInfoQuery';

type RoomForewordUsernameListItemProps = {
	href: string | undefined;
	isOneToOneDm: boolean;
	username: NonNullable<IUser['username']>;
};

const RoomForewordUsernameListItem = ({ username, href, isOneToOneDm }: RoomForewordUsernameListItemProps) => {
	const { t } = useTranslation();
	const { openTab, closeTab, tab, context } = useRoomToolbox();
	const { data, isLoading, isError, isSuccess } = useUserInfoQuery({ username });
	const displayName = useUserDisplayName({ name: data?.user?.name, username });

	const toggleUserInfo = useEffectEvent(() => {
		if (tab?.id === 'user-info') {
			const routeContext = context ?? '';
			if (routeContext === username || routeContext === '') {
				closeTab();
				return;
			}
		}
		openTab('user-info', username);
	});

	const handleClick = useCallback(
		(event: MouseEvent<HTMLElement>) => {
			event.preventDefault();
			toggleUserInfo();
		},
		[toggleUserInfo],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				toggleUserInfo();
			}
		},
		[toggleUserInfo],
	);

	if (isOneToOneDm) {
		return (
			<Tag
				icon={<Icon name='user' size='x20' />}
				data-username={username}
				large
				role='button'
				tabIndex={0}
				aria-label={`${t('User_Info')}: ${displayName || username}`}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
			>
				{isLoading && <Skeleton variant='rect' />}
				{isError && username}
				{isSuccess && displayName}
			</Tag>
		);
	}

	return (
		<Tag icon={<Icon name='user' size='x20' />} data-username={username} large href={href}>
			{isLoading && <Skeleton variant='rect' />}
			{isError && username}
			{isSuccess && displayName}
		</Tag>
	);
};

export default RoomForewordUsernameListItem;
