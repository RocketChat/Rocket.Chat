import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useSeatsCap = ():
	| {
			maxActiveUsers: number;
			activeUsers: number;
			reload: () => void;
	  }
	| undefined => {
	const fetch = useEndpoint('GET', '/v1/licenses.maxActiveUsers');

	const result = useQuery(['/v1/licenses.maxActiveUsers'], () => fetch());

	if (!result.isSuccess) {
		return undefined;
	}

	return {
		activeUsers: result.data.activeUsers,
		maxActiveUsers: result.data.maxActiveUsers ?? Number.POSITIVE_INFINITY,
		reload: () => result.refetch(),
	};
};
