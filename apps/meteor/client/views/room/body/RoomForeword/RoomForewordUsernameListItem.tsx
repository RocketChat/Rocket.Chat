import type { IUser } from '@rocket.chat/core-typings';
import { Icon, Tag, Skeleton } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUserCard } from '@rocket.chat/ui-contexts';

import { useUserInfoQuery } from '../../../../hooks/useUserInfoQuery';

type RoomForewordUsernameListItemProps = {
	username: NonNullable<IUser['username']>;
};

const RoomForewordUsernameListItem = ({ username }: RoomForewordUsernameListItemProps) => {
	const { data, isLoading, isError, isSuccess } = useUserInfoQuery({ username });
	const displayName = useUserDisplayName({ name: data?.user?.name, username });
	const { triggerProps, openUserCard } = useUserCard();
	const buttonProps = useButtonPattern((e) => openUserCard(e, username));

	return (
		<Tag
			icon={<Icon name='user' size='x20' />}
			data-username={username}
			large
			style={{ cursor: 'pointer' }}
			{...buttonProps}
			{...triggerProps}
		>
			{isLoading && <Skeleton variant='rect' />}
			{isError && username}
			{isSuccess && displayName}
		</Tag>
	);
};

export default RoomForewordUsernameListItem;
