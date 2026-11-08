import { useAbsoluteUrl, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import * as UiKit from '@rocket.chat/ui-kit';
import { useQueries } from '@tanstack/react-query';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MentionBudgetContext, createMentionBudget } from '../contexts/MentionBudgetContext';
import type { MentionNames } from '../utils/richText/richTextToAst';

const collectIds = (block: Pick<UiKit.RichTextBlock, 'elements'>) => {
	const users = new Set<string>();
	const channels = new Set<string>();
	const teams = new Set<string>();
	const messages = new Map<string, string>();

	for (const container of block.elements) {
		const inlines = container.type === 'rich_text_list' ? container.elements.flatMap((item) => item.elements) : container.elements;
		for (const element of inlines) {
			if (element.type === 'user') users.add(element.user_id);
			if (element.type === 'channel') channels.add(element.channel_id);
			if (element.type === 'usergroup') teams.add(element.usergroup_id);
			if (element.type === 'team') teams.add(element.team_id);
			if (element.type === 'message_mention' && !(element.url && UiKit.isSafeUrl(element.url))) {
				messages.set(element.message_id, element.channel_id);
			}
		}
	}

	const messageList = [...messages];
	// A message permalink needs its room, so rooms are fetched once whichever element asks for them.
	const rooms = [...new Set([...channels, ...messageList.map(([, roomId]) => roomId)])];

	return { users: [...users], rooms, teams: [...teams], messages: messageList };
};

const noIds = { users: [], rooms: [], teams: [], messages: [] };

/** Names for the users, channels and teams a rich text refers to by id, and permalinks for the messages it mentions; an id stays out of the result until it has loaded. */
export const useRichTextMentionNames = (block: Pick<UiKit.RichTextBlock, 'elements'> | undefined): MentionNames => {
	const { t } = useTranslation();
	const router = useRouter();
	const absoluteUrl = useAbsoluteUrl();
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const getTeamInfo = useEndpoint('GET', '/v1/teams.info');

	const [ownBudget] = useState(createMentionBudget);
	const budget = useContext(MentionBudgetContext) ?? ownBudget;

	const ids = useMemo(() => {
		const wanted = block ? collectIds(block) : noIds;

		// Ids past the budget of the surface stay unresolved, and so does a message whose room does.
		return {
			users: budget.claim('users', wanted.users),
			rooms: budget.claim('rooms', wanted.rooms),
			teams: budget.claim('teams', wanted.teams),
			messages: wanted.messages,
		};
	}, [block, budget]);

	const users = useQueries({
		queries: ids.users.map((userId) => ({
			queryKey: ['uikit', 'users.info', userId],
			queryFn: async () => [userId, (await getUserInfo({ userId })).user.username ?? userId] as const,
			staleTime: Infinity,
		})),
		combine: (results) => Object.fromEntries(results.flatMap(({ data }) => (data ? [data] : []))),
	});

	const rooms = useQueries({
		queries: ids.rooms.map((roomId) => ({
			queryKey: ['uikit', 'rooms.info', roomId],
			queryFn: async () => [roomId, (await getRoomInfo({ roomId })).room ?? null] as const,
			staleTime: Infinity,
		})),
		combine: (results) =>
			Object.fromEntries(results.flatMap(({ data }) => (data?.[1] ? [data as readonly [string, NonNullable<(typeof data)[1]>]] : []))),
	});

	const teams = useQueries({
		queries: ids.teams.map((teamId) => ({
			queryKey: ['uikit', 'teams.info', teamId],
			queryFn: async () => [teamId, (await getTeamInfo({ teamId })).teamInfo.name] as const,
			staleTime: Infinity,
		})),
		combine: (results) => Object.fromEntries(results.flatMap(({ data }) => (data ? [data] : []))),
	});

	const channels = useMemo(
		() => Object.fromEntries(ids.rooms.flatMap((roomId) => (rooms[roomId] ? [[roomId, rooms[roomId].name ?? roomId]] : []))),
		[ids.rooms, rooms],
	);

	const messageLinks = useMemo(
		() =>
			Object.fromEntries(
				ids.messages.flatMap(([messageId, roomId]) => {
					const room = rooms[roomId];

					return room
						? [
								[
									messageId,
									absoluteUrl(
										`${router.getRoomRoute(room.t, { rid: room._id, name: room.name }).path}?msg=${encodeURIComponent(messageId)}`,
									),
								],
							]
						: [];
				}),
			),
		[ids.messages, rooms, router, absoluteUrl],
	);

	const messageLabel = t('message');

	return useMemo(() => ({ users, channels, teams, messageLinks, messageLabel }), [users, channels, teams, messageLinks, messageLabel]);
};
