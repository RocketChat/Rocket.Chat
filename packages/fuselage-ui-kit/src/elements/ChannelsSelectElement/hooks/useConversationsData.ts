import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { ConversationsSelectFilter } from '@rocket.chat/ui-kit';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type UseConversationsDataProps = {
	filter: string;
	enabled?: boolean;
	selected?: string[];
	include?: ConversationsSelectFilter['include'];
};

type ConversationKind = NonNullable<ConversationsSelectFilter['include']>[number];

const allConversationKinds: ConversationKind[] = ['public', 'private', 'im', 'mpim'];

// ponytail: a group direct message is told apart by its name, the other members' usernames joined with ', '; breaks only if usernames may contain commas
const getConversationKind = ({ t, name }: { t: string; name?: string }): ConversationKind | undefined => {
	switch (t) {
		case 'c':
			return 'public';
		case 'p':
			return 'private';
		case 'd':
			return name?.includes(',') ? 'mpim' : 'im';
		default:
			return undefined;
	}
};

// ponytail: shows the first matches only; page through subscriptions if users need to scroll past them
const maxOptions = 50;

/** Options for the conversations the current user belongs to (channels, private groups and direct messages); selected ones are always included. */
export const useConversationsData = ({ filter, enabled = true, selected = [], include }: UseConversationsDataProps) => {
	const getSubscriptions = useEndpoint('GET', '/v1/subscriptions.get');

	const { data: subscriptions } = useQuery({
		queryKey: ['subscriptions.get'],
		queryFn: async () => (await getSubscriptions({})).update,
		enabled,
	});

	return useMemo(() => {
		const term = filter.toLowerCase();
		// Without `include`, every conversation kind is listed, and nothing else (no livechat rooms).
		const allowedKinds = include ?? allConversationKinds;
		const matches = ({ name, fname, t }: { name?: string; fname?: string; t: string }) => {
			const kind = getConversationKind({ t, name });
			return !!kind && allowedKinds.includes(kind) && (!term || [name, fname].some((value) => value?.toLowerCase().includes(term)));
		};

		const found = subscriptions?.filter(matches).slice(0, maxOptions) ?? [];
		const selectedOutsideResults =
			subscriptions?.filter(({ rid }) => selected.includes(rid) && !found.some((sub) => sub.rid === rid)) ?? [];

		return [...found, ...selectedOutsideResults].map(({ rid, name, fname, t }) => ({
			value: rid,
			label: { name: fname || name, avatarETag: undefined, type: t },
		}));
	}, [filter, include, selected, subscriptions]);
};
