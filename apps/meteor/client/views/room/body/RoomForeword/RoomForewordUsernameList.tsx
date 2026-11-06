import type { IUser } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';

import RoomForewordUsernameListItem from './RoomForewordUsernameListItem';

export type RoomForewordUsernameListProps = { usernames: Array<NonNullable<IUser['username']>> };

const RoomForewordUsernameList = ({ usernames }: RoomForewordUsernameListProps) => {
	const router = useRouter();

	return (
		<>
			{usernames.map((username) => (
				<RoomForewordUsernameListItem
					username={username}
					key={username}
					href={router.getRoomRoute('d', { name: username }).path || undefined}
				/>
			))}
		</>
	);
};

export default RoomForewordUsernameList;
