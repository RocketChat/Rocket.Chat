import { useEndpointData } from '../../../../../client/hooks/useEndpointData';

export const useSeatsCap = ():
	| {
			maxActiveUsers: number;
			activeUsers: number;
	  }
	| undefined => {
	const { value } = useEndpointData('licenses.maxActiveUsers');

	if (!value) {
		return undefined;
	}

	return {
		activeUsers: value.activeUsers,
		maxActiveUsers: value.maxActiveUsers ?? Number.POSITIVE_INFINITY,
	};
};
