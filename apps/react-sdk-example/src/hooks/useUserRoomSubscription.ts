import { useQuery } from '@tanstack/react-query';
import { useEndpoint } from '@rocket.chat/ui-contexts';

export const useUserRoomSubscription = (rid: string) => {
	const subscriptionEndpoint = useEndpoint('GET', '/v1/subscriptions.getOne');

	return useQuery(['roomData', rid], () => subscriptionEndpoint({ roomId: rid }));
};
