import type { IUser } from '@rocket.chat/core-typings';
import { Icon, Tag, Skeleton } from '@rocket.chat/fuselage';
import type { VFC } from 'react';
import React from 'react';

import { getUserDisplayName } from '../../../../../lib/getUserDisplayName';
import { useUserInfoQuery } from '../../../../hooks/useUserInfoQuery';

type RoomForewordUsernameListItemProps = {
	href: string | undefined;
	username: NonNullable<IUser['username']>;
	useRealName: boolean;
};

const RoomForewordUsernameListItem: VFC<RoomForewordUsernameListItemProps> = ({ username, href, useRealName }) => {
	const { data, isLoading, isError } = useUserInfoQuery({ username });

	return (
		<Tag icon={<Icon name='user' size='x20' />} data-username={username} large href={href}>
			{isLoading && <Skeleton variant='rect' />}
			{!isLoading && isError && username}
			{!isLoading && !isError && getUserDisplayName(data?.user?.name, username, useRealName)}
		</Tag>
	);
};

export default RoomForewordUsernameListItem;
