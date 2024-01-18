import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type usePendingUsersCountProps = {
	setPendingUsersCount: React.Dispatch<React.SetStateAction<number>>;
	currentUsersTotal: number | undefined;
};

const usePendingUsersCount = ({ setPendingUsersCount, currentUsersTotal }: usePendingUsersCountProps) => {
	const getUsers = useEndpoint('GET', '/v1/users.list/:status', { status: 'pending' });

	useQuery(
		['pendingUsersCount', currentUsersTotal],
		async () => {
			const payload = { count: 1, roles: [], searchTerm: '' };
			return getUsers(payload);
		},
		{
			onSuccess: (data) => {
				setPendingUsersCount(data ? data.total : 0);
			},
		},
	);
};

export default usePendingUsersCount;
