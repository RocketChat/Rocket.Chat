import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useMethod, useSetting, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { emoji } from '../../../../app/emoji/client';
import { Messages, Subscriptions } from '../../../../app/models/client';
import { slashCommands } from '../../../../app/utils/client';
import { cannedResponsesQueryKeys } from '../../../lib/queryKeys';
import ComposerBoxPopupCannedResponse from '../composer/ComposerBoxPopupCannedResponse';
import type { ComposerBoxPopupEmojiProps } from '../composer/ComposerBoxPopupEmoji';
import ComposerBoxPopupEmoji from '../composer/ComposerBoxPopupEmoji';
import ComposerBoxPopupRoom from '../composer/ComposerBoxPopupRoom';
import type { ComposerBoxPopupRoomProps } from '../composer/ComposerBoxPopupRoom';
import type { ComposerBoxPopupSlashCommandProps } from '../composer/ComposerBoxPopupSlashCommand';
import ComposerBoxPopupSlashCommand from '../composer/ComposerBoxPopupSlashCommand';
import ComposerBoxPopupUser from '../composer/ComposerBoxPopupUser';
import type { ComposerBoxPopupUserProps } from '../composer/ComposerBoxPopupUser';
import type { ComposerPopupContextValue } from '../contexts/ComposerPopupContext';
import { ComposerPopupContext, createMessageBoxPopupConfig } from '../contexts/ComposerPopupContext';
import useCannedResponsesQuery from './hooks/useCannedResponsesQuery';

export type CannedResponse = { _id: string; shortcut: string; text: string };

type ComposerPopupProviderProps = {
	children: ReactNode;
	room: IRoom;
};

const getLastRecentUsers = (rid: string, uid: string) => {
	const uniqueUsers = new Map<
		string,
		{
			_id: string;
			username: string;
			name?: string;
			ts: Date;
			suggestion?: boolean;
		}
	>();
	Messages.find(
		{
			rid,
			'u._id': { $ne: uid },
			't': { $exists: false },
			'ts': { $exists: true },
		},
		{
			fields: {
				'u.username': 1,
				'u.name': 1,
				'u._id': 1,
				'ts': 1,
			},
			sort: { ts: -1 },
		},
	).forEach(({ u: { username, name, _id }, ts }) => {
		if (!uniqueUsers.has(username)) {
			uniqueUsers.set(username, {
				_id,
				username,
				name,
				ts,
			});
		}
	});

	return Array.from(uniqueUsers.values());
};
const ComposerPopupProvider = ({ children, room }: ComposerPopupProviderProps) => {
	const { _id: rid, encrypted: isRoomEncrypted } = room;

	// TODO: this is awful because we are just triggering the query to get the data
	// and we are not using the data itself, we should find a better way to do this
	useCannedResponsesQuery(room);

	const userSpotlight = useMethod('spotlight');
	const suggestionsCount = useSetting('Number_of_users_autocomplete_suggestions', 5);
	const cannedResponseEnabled = useSetting('Canned_Responses_Enable', true);
	const [recentEmojis] = useLocalStorage('emoji.recent', []);
	const [previewTitle, setPreviewTitle] = useState('');
	const isOmnichannel = isOmnichannelRoom(room);
	const useEmoji = useUserPreference('useEmojis');
	const { t, i18n } = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable', false);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);
	const encrypted = isRoomEncrypted && e2eEnabled && !unencryptedMessagesAllowed;
	const queryClient = useQueryClient();
	const uid = useUserId();
	const call = useMethod('getSlashCommandPreviews');

	const value: ComposerPopupContextValue = useMemo(() => {
		return [
			createMessageBoxPopupConfig({
				trigger: '@',
				title: t('People'),
				getItemsFromLocal: async (filter: string) => {
					const filterRegex = filter && new RegExp(escapeRegExp(filter), 'i');
					const items: ComposerBoxPopupUserProps[] = [];

					const roomMessageUsers = getLastRecentUsers(rid, uid!)
						.filter((u) => {
							if (!filterRegex) return true;
							return filterRegex.test(u.username) || (u.name && filterRegex.test(u.name));
						})
						.sort((a, b) => b.ts.getTime() - a.ts.getTime())
						.slice(0, suggestionsCount ?? 5)
						.map((u) => ({
							...u,
							suggestion: true,
						}));

					if (!filterRegex || filterRegex.test('all')) {
						items.push({
							_id: 'all',
							username: 'all',
							system: true,
							name: t('Notify_all_in_this_room'),
							sort: 4,
						});
					}

					if (!filterRegex || filterRegex.test('here')) {
						items.push({
							_id: 'here',
							username: 'here',
							system: true,
							name: t('Notify_active_in_this_room'),
							sort: 4,
						});
					}

					return [...roomMessageUsers, ...items];
				},
				getItemsFromServer: async (filter: string) => {
					const filterRegex = filter && new RegExp(escapeRegExp(filter), 'i');
					const usernames = getLastRecentUsers(rid, uid!)
						.filter((u) => {
							if (!filterRegex) return true;
							return filterRegex.test(u.username) || (u.name && filterRegex.test(u.name));
						})
						.sort((a, b) => b.ts.getTime() - a.ts.getTime())
						.slice(0, suggestionsCount ?? 5)
						.map((u) => u.username);

					const { users = [] } = await userSpotlight(filter, usernames, { users: true, mentions: true }, rid);

					return users.map(({ _id, username, nickname, name, status, avatarETag, outside }) => {
						return {
							_id,
							username,
							nickname,
							name,
							status,
							avatarETag,
							outside,
							sort: 3,
						};
					});
				},
				getValue: (item) => item.username,
				renderItem: ({ item }) => <ComposerBoxPopupUser {...item} />,
			}),
			createMessageBoxPopupConfig<ComposerBoxPopupRoomProps>({
				trigger: '#',
				title: t('Channels'),
				getItemsFromLocal: async (filter: string) => {
					const filterRegex = new RegExp(escapeRegExp(filter), 'i');
					const records = Subscriptions.find(
						{
							$and: [
								{
									$or: [{ fname: filterRegex }, { name: filterRegex }],
								},
								{
									$or: [{ federated: { $exists: false } }, { federated: false }],
								},
							],
							t: {
								$in: ['c', 'p'],
							},
						},
						{
							limit: suggestionsCount ?? 5,
							sort: {
								ls: -1,
							},
						},
					).fetch();
					return records;
				},
				getItemsFromServer: async (filter: string) => {
					const { rooms = [] } = await userSpotlight(filter, [], { rooms: true, mentions: true }, rid);
					return rooms as unknown as ComposerBoxPopupRoomProps[];
				},
				getValue: (item) => `${item.name || item.fname}`,
				renderItem: ({ item }) => <ComposerBoxPopupRoom {...item} />,
			}) as any,
			useEmoji &&
				createMessageBoxPopupConfig<ComposerBoxPopupEmojiProps>({
					trigger: ':',
					title: t('Emoji'),
					triggerLength: 2,
					getItemsFromLocal: async (filter: string) => {
						const exactFinalTone = new RegExp('^tone[1-5]:*$');
						const colorBlind = new RegExp('tone[1-5]:*$');
						const seeColor = new RegExp('_t(?:o|$)(?:n|$)(?:e|$)(?:[1-5]|$)(?::|$)$');

						const emojiSort = (recents: string[]) => (a: { _id: string }, b: { _id: string }) => {
							const aExact = a._id === key ? 2 : 0;
							const bExact = b._id === key ? 2 : 0;
							const aPartial = a._id.startsWith(key) ? 1 : 0;
							const bPartial = b._id.startsWith(key) ? 1 : 0;

							let aScore = aExact + aPartial;
							let bScore = bExact + bPartial;

							if (recents.includes(a._id)) {
								aScore += recents.indexOf(a._id) + 1;
							}
							if (recents.includes(b._id)) {
								bScore += recents.indexOf(b._id) + 1;
							}

							if (aScore > bScore) {
								return -1;
							}
							if (aScore < bScore) {
								return 1;
							}
							return 0;
						};
						const filterRegex = new RegExp(escapeRegExp(filter), 'i');
						const key = `:${filter}`;

						const recents = recentEmojis.map((item) => `:${item}:`);

						const collection = emoji.list;

						return Object.keys(collection)
							.map((_id) => {
								const data = collection[key];
								return { _id, data };
							})
							.filter(
								({ _id }) =>
									filterRegex.test(_id) && (exactFinalTone.test(_id.substring(key.length)) || seeColor.test(key) || !colorBlind.test(_id)),
							)
							.sort(emojiSort(recents))
							.slice(0, 10);
					},
					getItemsFromServer: async () => {
						return [];
					},
					getValue: (item) => `${item._id.substring(1)}`,
					renderItem: ({ item }) => <ComposerBoxPopupEmoji {...item} />,
				}),
			createMessageBoxPopupConfig<ComposerBoxPopupEmojiProps>({
				title: t('Emoji'),
				trigger: '\\+:',
				prefix: '+',
				suffix: ' ',
				triggerAnywhere: false,
				getItemsFromLocal: async (filter: string) => {
					const exactFinalTone = new RegExp('^tone[1-5]:*$');
					const colorBlind = new RegExp('tone[1-5]:*$');
					const seeColor = new RegExp('_t(?:o|$)(?:n|$)(?:e|$)(?:[1-5]|$)(?::|$)$');

					const emojiSort = (recents: string[]) => (a: { _id: string }, b: { _id: string }) => {
						let idA = a._id;
						let idB = a._id;

						if (recents.includes(a._id)) {
							idA = recents.indexOf(a._id) + idA;
						}
						if (recents.includes(b._id)) {
							idB = recents.indexOf(b._id) + idB;
						}

						if (idA < idB) {
							return -1;
						}

						if (idA > idB) {
							return 1;
						}

						return 0;
					};
					const filterRegex = new RegExp(escapeRegExp(filter), 'i');
					const key = `:${filter}`;

					const recents = recentEmojis.map((item) => `:${item}:`);

					const collection = emoji.list;

					return Object.keys(collection)
						.map((_id) => {
							const data = collection[key];
							return { _id, data };
						})
						.filter(
							({ _id }) =>
								filterRegex.test(_id) && (exactFinalTone.test(_id.substring(key.length)) || seeColor.test(key) || !colorBlind.test(_id)),
						)
						.sort(emojiSort(recents))
						.slice(0, 10);
				},
				getItemsFromServer: async () => {
					return [];
				},
				getValue: (item) => `${item._id}`,
				renderItem: ({ item }) => <ComposerBoxPopupEmoji {...item} />,
			}),

			createMessageBoxPopupConfig<ComposerBoxPopupSlashCommandProps>({
				title: t('Commands'),
				trigger: '/',
				suffix: ' ',
				triggerAnywhere: false,
				disabled: encrypted,
				renderItem: ({ item }) => <ComposerBoxPopupSlashCommand {...item} />,
				getItemsFromLocal: async (filter: string) => {
					return Object.keys(slashCommands.commands)
						.map((command) => {
							const item = slashCommands.commands[command];
							return {
								_id: command,
								params: item.params && i18n.exists(item.params) ? t(item.params) : (item.params ?? ''),
								description: item.description && i18n.exists(item.description) ? t(item.description) : item.description,
								permission: item.permission,
								...(encrypted && { disabled: encrypted }),
							};
						})
						.filter((command) => {
							const isMatch = command._id.indexOf(filter) > -1;

							if (!isMatch) {
								return false;
							}

							if (!command.permission) {
								return true;
							}

							return hasAtLeastOnePermission(command.permission, rid);
						})
						.sort((a, b) => a._id.localeCompare(b._id))
						.slice(0, 11);
				},
				getItemsFromServer: async () => [],
			}),
			cannedResponseEnabled &&
				isOmnichannel &&
				createMessageBoxPopupConfig<{
					_id: string;
					text: string;
					shortcut: string;
				}>({
					title: t('Canned_Responses'),
					trigger: '!',
					prefix: '',
					triggerAnywhere: true,
					renderItem: ({ item }) => <ComposerBoxPopupCannedResponse {...item} />,
					getItemsFromLocal: async (filter: string) => {
						const exp = new RegExp(filter, 'i');
						// TODO: this is bad, but can only be fixed by refactoring the whole thing
						const cannedResponses = queryClient.getQueryData<CannedResponse[]>(cannedResponsesQueryKeys.all) ?? [];
						return cannedResponses
							.filter((record) => record.shortcut.match(exp))
							.sort((a, b) => a.shortcut.localeCompare(b.shortcut))
							.slice(0, 11)
							.map((record) => ({
								_id: record._id,
								text: record.text,
								shortcut: record.shortcut,
							}));
					},
					getItemsFromServer: async () => [],
					getValue: (item) => item.text,
				}),
			createMessageBoxPopupConfig({
				title: previewTitle,
				matchSelectorRegex: /(?:^)(\/[\w\d\S]+ )[^]*$/,
				preview: true,
				getItemsFromLocal: async ({ cmd, params, tmid }: { cmd: string; params: string; tmid: string }) => {
					const result = await call({ cmd, params, msg: { rid, tmid } });

					setPreviewTitle(t(result?.i18nTitle ?? ''));

					return (
						result?.items.map((item) => ({
							_id: item.id,
							value: item.value,
							type: item.type,
						})) ?? []
					);
				},
			}),
		].filter(Boolean);
	}, [
		call,
		cannedResponseEnabled,
		encrypted,
		i18n,
		isOmnichannel,
		previewTitle,
		queryClient,
		recentEmojis,
		rid,
		suggestionsCount,
		t,
		uid,
		useEmoji,
		userSpotlight,
	]);

	return <ComposerPopupContext.Provider value={value} children={children} />;
};

export default ComposerPopupProvider;
