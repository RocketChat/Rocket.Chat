import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type usePendingUsersCountProps = {
	tab: string;
	setPendingUsersCount: React.Dispatch<React.SetStateAction<number>>;
	currentUsersTotal: number | undefined;
};

const usePendingUsersCount = ({ tab, setPendingUsersCount, currentUsersTotal }: usePendingUsersCountProps) => {
	const getUsers = useEndpoint('GET', '/v1/users.list/:status', { status: 'pending' });

	const dispatchToastMessage = useToastMessageDispatch();

	const payload = { count: 1, roles: [], searchTerm: '' };

	const pendingUsersListQueryResult = useQuery(['pendingUsersCount', tab, currentUsersTotal], async () => getUsers(payload), {
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	if (pendingUsersListQueryResult.isSuccess && pendingUsersListQueryResult.data) {
		setPendingUsersCount(pendingUsersListQueryResult.data.total);
		return;
	}

	setPendingUsersCount(0);
};

export default usePendingUsersCount;
