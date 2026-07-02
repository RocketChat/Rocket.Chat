import type { IUser } from '@rocket.chat/core-typings';
import { Margins } from '@rocket.chat/fuselage';

import RoomForewordUsernameListItem from './RoomForewordUsernameListItem';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

type RoomForewordUsernameListProps = {
	isOneToOneDm: boolean;
	usernames: Array<NonNullable<IUser['username']>>;
};

const RoomForewordUsernameList = ({ isOneToOneDm, usernames }: RoomForewordUsernameListProps) => {
	return (
		<Margins inline={4}>
			{usernames.map((username) => (
				<RoomForewordUsernameListItem
					isOneToOneDm={isOneToOneDm}
					username={username}
					key={username}
					href={roomCoordinator.getRouteLink('d', { name: username }) || undefined}
				/>
			))}
		</Margins>
	);
};

export default RoomForewordUsernameList;
