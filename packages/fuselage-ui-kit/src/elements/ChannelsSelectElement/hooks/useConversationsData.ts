import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type UseConversationsDataProps = {
	filter: string;
	enabled?: boolean;
	selected?: string[];
};

// ponytail: shows the first matches only; page through subscriptions if users need to scroll past them
const maxOptions = 50;

/** Options for the conversations the current user belongs to (channels, private groups and direct messages); selected ones are always included. */
export const useConversationsData = ({ filter, enabled = true, selected = [] }: UseConversationsDataProps) => {
	const getSubscriptions = useEndpoint('GET', '/v1/subscriptions.get');

	const { data: subscriptions } = useQuery({
		queryKey: ['subscriptions.get'],
		queryFn: async () => (await getSubscriptions({})).update,
		enabled,
	});

	return useMemo(() => {
		const term = filter.toLowerCase();
		const matches = ({ name, fname }: { name?: string; fname?: string }) =>
			!term || [name, fname].some((value) => value?.toLowerCase().includes(term));

		const found = subscriptions?.filter(matches).slice(0, maxOptions) ?? [];
		const selectedOutsideResults =
			subscriptions?.filter(({ rid }) => selected.includes(rid) && !found.some((sub) => sub.rid === rid)) ?? [];

		return [...found, ...selectedOutsideResults].map(({ rid, name, fname, t }) => ({
			value: rid,
			label: { name: fname || name, avatarETag: undefined, type: t },
		}));
	}, [filter, selected, subscriptions]);
};
