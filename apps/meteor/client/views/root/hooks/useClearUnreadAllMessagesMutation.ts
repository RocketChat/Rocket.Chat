import { useEndpoint } from '@rocket.chat/ui-contexts';

import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { Subscriptions } from '../../../stores';

export const useClearUnreadAllMessagesMutation = (options?: Omit<UseMutationOptions<void, unknown, void, unknown>, 'mutationFn'>) => {
	const readSubscription = useEndpoint('POST', '/v1/subscriptions.read');

	return useMutation({
		mutationFn: async () => {
			const promises = Subscriptions.state
				.filter((record) => record.open)
				.map((subscription) => {
					if (subscription.alert || subscription.unread > 0) {
						return readSubscription({ rid: subscription.rid, readThreads: true });
					}

					return Promise.resolve();
				});

			await Promise.all(promises);
		},
		...options,
	});
};
