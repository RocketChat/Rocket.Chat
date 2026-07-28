import { expect } from 'chai';
import { describe, it, beforeEach, before } from 'mocha';

import {
	createEmojiList,
	getEmojisBySearchTerm,
	getFrequentEmoji,
	updateRecent,
	removeFromRecent,
	replaceEmojiInRecent,
} from '../../../../app/emoji/client/helpers';
import { emoji } from '../../../../app/emoji/client/lib';
import { getEmojiConfig } from '../../../../app/emoji-native/lib/getEmojiConfig';
import { legacyEmojioneMap } from '../../../../app/emoji-native/lib/legacyEmojioneMap';

const registerNativeEmojis = () => {
	const config = getEmojiConfig(emoji);

	emoji.packages.native = {
		emojiCategories: config.emojiCategories as any,
		emojisByCategory: config.emojisByCategory,
		toneList: config.toneList,
		render: config.render,
		renderPicker: config.renderPicker,
		sprites: config.sprites,
	};

	for (const [key, currentEmoji] of Object.entries(config.emojiList)) {
		currentEmoji.emojiPackage = 'native';
		emoji.list[key] = currentEmoji as any;

		if (currentEmoji.shortnames) {
			currentEmoji.shortnames.forEach((shortname: string) => {
				emoji.list[shortname] = currentEmoji as any;
			});
		}
	}
};

const registerCustomEmoji = (name: string) => {
	if (!emoji.packages.emojiCustom) {
		emoji.packages.emojiCustom = {
			emojiCategories: [{ key: 'rocket', i18n: 'Custom' as any }],
			emojisByCategory: { rocket: [] },
			toneList: {},
			render: (html: string) => html,
			renderPicker: () => '<span class="emoji-custom" />',
		} as any;
	}
	emoji.packages.emojiCustom.emojisByCategory.rocket.push(name);
	emoji.list[`:${name}:`] = { emojiPackage: 'emojiCustom', name } as any;
};

describe('Emoji Client Helpers', () => {
	beforeEach(() => {
		emoji.packages.base.emojisByCategory.recent = [];
	});

	describe('getEmojisBySearchTerm', () => {
		before(registerNativeEmojis);

		const search = (term: string) => getEmojisBySearchTerm(term, 0, [], () => undefined);
		const names = (term: string) => search(term).map((result) => result.emoji);
		const rendersThumbsUp = (term: string) => search(term).some((result) => result.image?.includes('👍'));

		it('finds an emoji by its primary shortcode', () => {
			expect(names('+1')).to.include('+1');
		});

		it('finds an emoji by its first alias (thumbsup -> 👍)', () => {
			expect(rendersThumbsUp('thumbsup')).to.be.true;
		});

		it('finds an emoji by a secondary alias (thumbup -> 👍)', () => {
			expect(rendersThumbsUp('thumbup')).to.be.true;
		});

		it('matches aliases partially (thumb -> thumbsup)', () => {
			expect(names('thumb')).to.include('thumbsup');
		});

		it('does not list the same emoji more than once', () => {
			const images = search('grinning').map((result) => result.image);
			expect(images.length).to.equal(new Set(images).size);
		});

		it('excludes skin-tone variants from the results', () => {
			expect(names('+1').some((name) => /_tone[1-5]/.test(name))).to.be.false;
		});

		it('applies the selected skin tone when searching by an alias', () => {
			const result = getEmojisBySearchTerm('thumbsup', 2, [], () => undefined).find(({ image }) => image?.includes('👍'));

			expect(result).to.exist;
			expect(result?.image).to.include('👍🏼');
			expect(result?.emoji).to.equal('thumbsup_tone2');
		});

		it('finds a custom emoji whose name ends in a mixed skin-tone suffix (CORE-2473)', () => {
			registerCustomEmoji('mycustom_tone1-2');
			expect(names('mycustom_tone1-2')).to.include('mycustom_tone1-2');
		});

		it('includes mixed-tone variants matching the selected skin tone', () => {
			const results = getEmojisBySearchTerm('holding', 3, [], () => undefined).map((result) => result.emoji);
			expect(results.some((name) => /_tone3-[1-5]$/.test(name))).to.be.true;
		});
	});

	describe('createEmojiList', () => {
		before(registerNativeEmojis);

		const listNames = (category: string, recentEmojis: string[]) =>
			createEmojiList(90, category, 0, recentEmojis, () => undefined).flatMap((row) =>
				Array.isArray(row) ? row.map((item) => item.emoji) : [],
			);

		it('skips an unresolvable name without truncating the rest of the category', () => {
			emoji.packages.base.emojisByCategory.recent = ['heart', 'name_that_never_existed', 'fire'];
			const names = listNames('recent', emoji.packages.base.emojisByCategory.recent);
			expect(names).to.include('heart');
			expect(names).to.include('fire');
		});

		it('renders legacy emojione-only shortcodes registered in emoji.list', () => {
			for (const [shortcode, unicode] of Object.entries(legacyEmojioneMap)) {
				const key = `:${shortcode}:`;
				if (emoji.list[key]) continue;
				emoji.list[key] = {
					uc_base: '',
					uc_output: '',
					uc_match: '',
					uc_greedy: '',
					shortnames: [],
					category: '',
					emojiPackage: 'native',
					unicode,
				} as any;
			}

			emoji.packages.base.emojisByCategory.recent = ['digit_one'];
			expect(listNames('recent', emoji.packages.base.emojisByCategory.recent)).to.include('digit_one');
		});
	});

	describe('getFrequentEmoji', () => {
		before(registerNativeEmojis);

		it('omits names that no longer resolve instead of yielding empty slots', () => {
			const result = getFrequentEmoji(['name_that_never_existed', 'fire']);
			expect(result.map(({ emoji: name }) => name)).to.include('fire');
			result.forEach(({ image }) => expect(image, 'every returned entry must render').to.be.a('string'));
		});
	});

	describe('updateRecent', () => {
		it('should update recent emojis with the provided emojis', () => {
			const recentEmojis = ['emoji1', 'emoji2'];
			updateRecent(recentEmojis);
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji1');
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji2');
		});
	});

	describe('removeFromRecent', () => {
		it('should remove a specific emoji from recent emojis', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2', 'emoji3'];
			removeFromRecent('emoji2', emoji.packages.base.emojisByCategory.recent);
			expect(emoji.packages.base.emojisByCategory.recent).to.not.include('emoji2');
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji3']);
		});

		it('should do nothing if the emoji is not in the recent list', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2'];
			removeFromRecent('emoji3', emoji.packages.base.emojisByCategory.recent);
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji2']);
		});
	});

	describe('replaceEmojiInRecent', () => {
		it('should replace an existing emoji with a new one in recent emojis', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2', 'emoji3'];
			replaceEmojiInRecent({ oldEmoji: 'emoji2', newEmoji: 'emoji4' });
			expect(emoji.packages.base.emojisByCategory.recent).to.not.include('emoji2');
			expect(emoji.packages.base.emojisByCategory.recent).to.include('emoji4');
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji4', 'emoji3']);
		});

		it('should do nothing if the emoji to replace is not in the recent list', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2'];
			replaceEmojiInRecent({ oldEmoji: 'emoji3', newEmoji: 'emoji4' });
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji2']);
		});
	});
});
