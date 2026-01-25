import type { IUser } from '@rocket.chat/core-typings';
import { Margins } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';

import RoomForewordUsernameListItem from './RoomForewordUsernameListItem';

type RoomForewordUsernameListProps = { usernames: Array<NonNullable<IUser['username']>> };

const RoomForewordUsernameList = ({ usernames }: RoomForewordUsernameListProps) => {
	const router = useRouter();

	return (
		<Margins inline={4}>
			{usernames.map((username) => (
				<RoomForewordUsernameListItem
					username={username}
					key={username}
					href={router.getRoomRoute('d', { name: username }).path || undefined}
				/>
			))}
		</Margins>
	);
};

export default RoomForewordUsernameList;
