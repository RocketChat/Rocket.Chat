import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { emoji } from '../../../app/emoji/client';
import { createMessageBoxPopupConfig } from '../AutocompletePopup';
import Emoji from '../Emoji';

export type ComposerBoxPopupEmojiProps = {
	_id: string;
};

export function ComposerBoxPopupEmoji({ _id }: ComposerBoxPopupEmojiProps) {
	return (
		<>
			<OptionColumn>
				<Emoji emojiHandle={_id} />
			</OptionColumn>
			<OptionContent>{_id}</OptionContent>
		</>
	);
}

type CreateEmojiPopupConfigParams = {
	t: (key: TranslationKey) => string;
	recentEmojis: string[];
};

export const createEmojiPopupConfig = ({ t, recentEmojis }: CreateEmojiPopupConfigParams) =>
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
				.map((_id) => ({ _id }))
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
	});
