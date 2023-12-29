import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useUserSubscriptions = () => {
	const uid = useUserId();

	const subscriptionsEndpoint = useEndpoint('GET', '/v1/subscriptions.get');
	const notifyUserStream = useStream('notify-user');

	const { refetch, ...subscriptions } = useQuery(['subscriptions', {}], () => subscriptionsEndpoint({}), {
		select(data) {
			if (data.update) {
				return data.update;
			}
			return data;
		},
	});

	useEffect(() => notifyUserStream(`${uid}/subscriptions-changed`, () => refetch()), [notifyUserStream, uid, refetch]);

	return subscriptions;
};
