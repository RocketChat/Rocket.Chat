import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useMethod, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import type { ReactNode } from 'react';

import { emoji, EmojiPicker } from '../../../../app/emoji/client';
import { Subscriptions } from '../../../../app/models/client';
import ComposerPopupEmoji from '../../../../app/ui-message/client/popup/components/ComposerBoxPopupEmoji';
import type { ComposerBoxPopupRoomProps } from '../../../../app/ui-message/client/popup/components/ComposerBoxPopupRoom';
import ComposerBoxPopupRoom from '../../../../app/ui-message/client/popup/components/ComposerBoxPopupRoom';
import ComposerBoxPopupUser from '../../../../app/ui-message/client/popup/components/ComposerBoxPopupUser';
import type { ComposerBoxPopupUserProps } from '../../../../app/ui-message/client/popup/components/ComposerBoxPopupUser';
import { usersFromRoomMessages } from '../../../../app/ui-message/client/popup/messagePopupConfig';
import type { ComposerPopupContextValue } from '../contexts/ComposerPopupContext';
import { ComposerPopupContext, createMessageBoxPopupConfig } from '../contexts/ComposerPopupContext';

const ComposerPopupProvider = ({ children, rid }: { children: ReactNode; rid: string }) => {
	const userSpotlight = useMethod('spotlight');
	const suggestionsCount = useSetting<number>('Number_of_users_autocomplete_suggestions');

	const t = useTranslation();
	const value: ComposerPopupContextValue = useMemo(() => {
		return [
			createMessageBoxPopupConfig({
				trigger: '@',
				title: t('People'),
				getItemsFromLocal: async (filter: string) => {
					const filterRegex = filter && new RegExp(escapeRegExp(filter), 'i');
					const items: ComposerBoxPopupUserProps[] = [];

					const users = usersFromRoomMessages
						.find(
							{
								ts: { $exists: true },
								...(filter && {
									$or: [{ username: filterRegex }, { name: filterRegex }],
								}),
							},
							{
								limit: suggestionsCount ?? 5,
								sort: { ts: -1 },
							},
						)
						.fetch()
						.map((u) => {
							u.suggestion = true;
							return u;
						});
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

					return [...users, ...items];
				},
				getItemsFromServer: async (filter: string) => {
					const filterRegex = filter && new RegExp(escapeRegExp(filter), 'i');
					const usernames = usersFromRoomMessages
						.find(
							{
								ts: { $exists: true },
								...(filter && {
									$or: [{ username: filterRegex }, { name: filterRegex }],
								}),
							},
							{
								limit: suggestionsCount ?? 5,
								sort: { ts: -1 },
							},
						)
						.fetch()
						.map((u) => {
							return u.username;
						});
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
							name: filterRegex,
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
					const { rooms = [] } = await userSpotlight(filter, undefined, { rooms: true, mentions: true }, rid);
					return rooms;
				},
				getValue: (item) => `${item.fname || item.name}`,
				renderItem: ({ item }) => <ComposerBoxPopupRoom {...item} />,
			}),
			createMessageBoxPopupConfig<ComposerBoxPopupRoomProps>({
				trigger: ':',
				title: t('Emoji'),
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

					const recents = EmojiPicker.getRecent().map((item) => `:${item}:`);

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
				renderItem: ({ item }) => <ComposerPopupEmoji {...item} />,
			}),
			createMessageBoxPopupConfig<ComposerBoxPopupRoomProps>({
				title: t('Emoji'),
				template: 'messagePopupEmoji',
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

					const recents = EmojiPicker.getRecent().map((item) => `:${item}:`);

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
				renderItem: ({ item }) => <ComposerPopupEmoji {...item} />,
			}),
		];
	}, [t, suggestionsCount, userSpotlight, rid]);

	return <ComposerPopupContext.Provider value={value} children={children} />;
};

export default ComposerPopupProvider;
