import type { IUser } from '@rocket.chat/core-typings';
import { Icon, Tag, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { getUserDisplayName } from '../../../../../lib/getUserDisplayName';
import { useUserInfoQuery } from '../../../../hooks/useUserInfoQuery';

type RoomForewordUsernameListItemProps = {
	href: string | undefined;
	username: NonNullable<IUser['username']>;
	useRealName: boolean;
};

const RoomForewordUsernameListItem = ({ username, href, useRealName }: RoomForewordUsernameListItemProps) => {
	const { data, isPending, isError } = useUserInfoQuery({ username });

	return (
		<Tag icon={<Icon name='user' size='x20' />} data-username={username} large href={href}>
			{isPending && <Skeleton variant='rect' />}
			{!isPending && isError && username}
			{!isPending && !isError && getUserDisplayName(data?.user?.name, username, useRealName)}
		</Tag>
	);
};

export default RoomForewordUsernameListItem;
