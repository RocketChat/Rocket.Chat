import { emoji } from '../../emoji/server';
import { getEmojiConfig } from '../lib/getEmojiConfig';
import { legacyEmojioneMap } from '../lib/legacyEmojioneMap';

const config = getEmojiConfig();

emoji.packages.native = {
	emojiCategories: config.emojiCategories as typeof emoji.packages.native.emojiCategories,
	emojisByCategory: config.emojisByCategory,
	toneList: config.toneList,
	render: config.render,
	renderPicker: config.renderPicker,
	sprites: config.sprites,
};

for (const [key, currentEmoji] of Object.entries(config.emojiList)) {
	currentEmoji.emojiPackage = 'native';
	emoji.list[key] = currentEmoji;

	if (currentEmoji.shortnames) {
		currentEmoji.shortnames.forEach((shortname: string) => {
			emoji.list[shortname] = currentEmoji;
		});
	}
}

// Register legacy emojione shortcodes so old reactions and stored shortcodes resolve correctly
for (const [shortcode, unicode] of Object.entries(legacyEmojioneMap)) {
	const key = `:${shortcode}:`;
	if (emoji.list[key]) continue; // already registered by emojibase

	emoji.list[key] = {
		uc_base: '',
		uc_output: '',
		uc_match: '',
		uc_greedy: '',
		shortnames: [],
		category: '',
		emojiPackage: 'native',
		unicode,
	};
}
