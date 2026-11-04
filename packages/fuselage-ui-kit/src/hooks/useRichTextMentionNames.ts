import { useEndpoint } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { MentionNames } from '../utils/richText/richTextToAst';

const collectIds = (block: Pick<UiKit.RichTextBlock, 'elements'>) => {
	const users = new Set<string>();
	const channels = new Set<string>();

	for (const container of block.elements) {
		const inlines = container.type === 'rich_text_list' ? container.elements.flatMap((item) => item.elements) : container.elements;
		for (const element of inlines) {
			if (element.type === 'user') users.add(element.user_id);
			if (element.type === 'channel') channels.add(element.channel_id);
		}
	}

	return { users: [...users], channels: [...channels] };
};

/** Names for the users and channels a rich text refers to by id; an id stays out of the result until its name has loaded. */
export const useRichTextMentionNames = (block: Pick<UiKit.RichTextBlock, 'elements'> | undefined): MentionNames => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	const ids = useMemo(() => (block ? collectIds(block) : { users: [], channels: [] }), [block]);

	const users = useQueries({
		queries: ids.users.map((userId) => ({
			queryKey: ['uikit', 'users.info', userId],
			queryFn: async () => [userId, (await getUserInfo({ userId })).user.username ?? userId] as const,
			staleTime: Infinity,
		})),
		combine: (results) => Object.fromEntries(results.flatMap(({ data }) => (data ? [data] : []))),
	});

	const channels = useQueries({
		queries: ids.channels.map((roomId) => ({
			queryKey: ['uikit', 'rooms.info', roomId],
			queryFn: async () => [roomId, (await getRoomInfo({ roomId })).room?.name ?? roomId] as const,
			staleTime: Infinity,
		})),
		combine: (results) => Object.fromEntries(results.flatMap(({ data }) => (data ? [data] : []))),
	});

	return useMemo(() => ({ users, channels }), [users, channels]);
};
