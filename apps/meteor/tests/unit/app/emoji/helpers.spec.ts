import { expect } from 'chai';
import { describe, it, beforeEach, before } from 'mocha';

import { getEmojiConfig } from '../../../../app/emoji-native/lib/getEmojiConfig';
import { getEmojisBySearchTerm, updateRecent, removeFromRecent, replaceEmojiInRecent } from '../../../../client/lib/emoji/helpers';
import { emoji } from '../../../../client/lib/emoji/lib';

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
