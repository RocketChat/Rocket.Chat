import type { IUser } from '@rocket.chat/core-typings';
import { Margins } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';

import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import RoomForewordUsernameListItem from './RoomForewordUsernameListItem';

type RoomForewordUsernameListProps = { usernames: Array<NonNullable<IUser['username']>> };

const RoomForewordUsernameList = ({ usernames }: RoomForewordUsernameListProps) => {
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));
	return (
		<Margins inline={4}>
			{usernames.map((username) => (
				<RoomForewordUsernameListItem
					username={username}
					key={username}
					href={roomCoordinator.getRouteLink('d', { name: username }) || undefined}
					useRealName={useRealName}
				/>
			))}
		</Margins>
	);
};

export default RoomForewordUsernameList;
