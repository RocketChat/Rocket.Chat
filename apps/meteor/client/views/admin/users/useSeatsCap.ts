import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export type SeatCapProps = {
	maxActiveUsers: number;
	activeUsers: number;
	reload: () => void;
};

export const useSeatsCap = (): SeatCapProps | undefined => {
	// #TODO: Stop using this endpoint
	const fetch = useEndpoint('GET', '/v1/licenses.maxActiveUsers');

	const result = useQuery({
		queryKey: ['/v1/licenses.maxActiveUsers'],
		queryFn: () => fetch(),
	});

	if (!result.isSuccess) {
		return undefined;
	}

	return {
		activeUsers: result.data.activeUsers,
		maxActiveUsers: result.data.maxActiveUsers && result.data.maxActiveUsers > 0 ? result.data.maxActiveUsers : Number.POSITIVE_INFINITY,
		reload: () => result.refetch(),
	};
};
