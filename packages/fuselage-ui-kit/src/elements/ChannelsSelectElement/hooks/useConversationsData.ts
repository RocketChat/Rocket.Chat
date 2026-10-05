import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type UseConversationsDataProps = {
	filter: string;
	enabled?: boolean;
};

// ponytail: shows the first matches only; page through subscriptions if users need to scroll past them
const maxOptions = 50;

/** Options for the conversations the current user belongs to (channels, private groups and direct messages). */
export const useConversationsData = ({ filter, enabled = true }: UseConversationsDataProps) => {
	const getSubscriptions = useEndpoint('GET', '/v1/subscriptions.get');

	const { data: subscriptions } = useQuery({
		queryKey: ['subscriptions.get'],
		queryFn: async () => (await getSubscriptions({})).update,
		enabled,
	});

	return useMemo(() => {
		const term = filter.toLowerCase();

		return subscriptions
			?.filter(({ name, fname }) => !term || [name, fname].some((value) => value?.toLowerCase().includes(term)))
			.slice(0, maxOptions)
			.map(({ rid, name, fname, t }) => ({
				value: rid,
				label: { name: fname || name, avatarETag: undefined, type: t },
			}));
	}, [filter, subscriptions]);
};
