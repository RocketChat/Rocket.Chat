import type { IUser } from '@rocket.chat/core-typings';
import { Box, Icon, Tag, Skeleton } from '@rocket.chat/fuselage';
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
		<Box mi={4} is='a' href={href}>
			<Tag icon={<Icon name='user' size='x20' />} className='mention-link' data-username={username} large>
				{isLoading && <Skeleton variant='rect' />}
				{!isLoading && isError && username}
				{!isLoading && !isError && getUserDisplayName(data?.user?.name, username, useRealName)}
			</Tag>
		</Box>
	);
};

export default RoomForewordUsernameListItem;
