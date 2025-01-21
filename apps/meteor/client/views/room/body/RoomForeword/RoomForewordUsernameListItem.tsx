import type { IUser } from '@rocket.chat/core-typings';
import { Icon, Tag, Skeleton } from '@rocket.chat/fuselage';

import { getUserDisplayName } from '../../../../../lib/getUserDisplayName';
import { useUserInfoQuery } from '../../../../hooks/useUserInfoQuery';

type RoomForewordUsernameListItemProps = {
	href: string | undefined;
	username: NonNullable<IUser['username']>;
	useRealName: boolean;
};

const RoomForewordUsernameListItem = ({ username, href, useRealName }: RoomForewordUsernameListItemProps) => {
	const { data, isLoading, isError, isSuccess } = useUserInfoQuery({ username });

	return (
		<Tag icon={<Icon name='user' size='x20' />} data-username={username} large href={href}>
			{isLoading && <Skeleton variant='rect' />}
			{isError && username}
			{isSuccess && getUserDisplayName(data?.user?.name, username, useRealName)}
		</Tag>
	);
};

export default RoomForewordUsernameListItem;
