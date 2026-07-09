import type { ICustomEmojiListEntry, IEmojiAlias } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { emoji } from '../../../../../app/emoji/client';
import { customRender } from '../../../../lib/customEmoji';

export const useCustomEmoji = () => {
	const getCustomEmojis = useEndpoint('GET', '/v1/emoji-custom.list');
	const result = useQuery({
		queryKey: ['emoji-custom.list'],
		queryFn: () => getCustomEmojis({ query: '' }),
	});

	useEffect(() => {
		emoji.packages.emojiCustom = {
			emojiCategories: [{ key: 'rocket', i18n: 'Custom' }],
			categoryIndex: 1,
			toneList: {},
			list: [],
			_regexpSignature: null,
			_regexp: null,
			emojisByCategory: { rocket: [] },
			render: customRender,
			renderPicker: customRender,
		};

		if (result.isError) {
			console.error('Error getting custom emoji ', result.error);
		}

		if (result.isSuccess) {
			const {
				emojis: { update: customEmojis },
			} = result.data;

			const addCustomEmojis = () => {
				for (const currentEmoji of customEmojis) {
					emoji.packages.emojiCustom.emojisByCategory.rocket.push(currentEmoji.name);
					emoji.packages.emojiCustom.list?.push(`:${currentEmoji.name}:`);
					const customEmojiEntry: ICustomEmojiListEntry = {
						name: currentEmoji.name,
						aliases: currentEmoji.aliases,
						extension: currentEmoji.extension,
						etag: currentEmoji.etag,
						emojiPackage: 'emojiCustom',
					};
					emoji.list[`:${currentEmoji.name}:`] = customEmojiEntry;
					for (const alias of currentEmoji.aliases) {
						emoji.packages.emojiCustom.list?.push(`:${alias}:`);
						const aliasEntry: IEmojiAlias = {
							emojiPackage: 'emojiCustom',
							aliasOf: currentEmoji.name,
						};
						emoji.list[`:${alias}:`] = aliasEntry;
					}
				}
				emoji.dispatchUpdate();
			};
			addCustomEmojis();
		}
	}, [result.data, result.error, result.isError, result.isSuccess]);
};
