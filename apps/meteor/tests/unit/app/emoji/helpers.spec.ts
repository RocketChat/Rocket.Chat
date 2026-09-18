import { expect } from 'chai';
import { describe, it, beforeEach, afterEach, before } from 'mocha';

import { getEmojiConfig } from '../../../../app/emoji-native/lib/getEmojiConfig';
import {
	CUSTOM_CATEGORY,
	createEmojiList,
	getEmojisBySearchTerm,
	isLoadMore,
	updateRecent,
	removeFromRecent,
	replaceEmojiInRecent,
} from '../../../../client/lib/emoji/helpers';
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

const fakePackage = (emojisByCategory: Record<string, string[]>, renderPicker: (emojiToRender: string) => string | undefined) =>
	({ emojisByCategory, toneList: {}, renderPicker }) as any;

const listEmojiNames = (rows: ReturnType<typeof createEmojiList>) =>
	rows.flatMap((row) => (isLoadMore(row) ? [] : row.map(({ emoji: name }) => name)));

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

		it('leaves out native mixed skin-tone variants that do not match the selected tone', () => {
			expect(names('handshake')).to.deep.equal(['handshake']);
		});

		it('drops a recent entry whose toned variant does not exist and notifies the caller', () => {
			// `:handshake_tone1-2:` passes the tone filter when tone 1 is selected, and the search then looks
			// its toned variant `:handshake_tone1-2_tone1:` up, which no emoji package provides.
			const recentEmojis = ['handshake_tone1-2_tone1', 'smile'];
			const updates: string[][] = [];

			const results = getEmojisBySearchTerm('handshake', 1, recentEmojis, (emojis) => updates.push([...emojis]));

			expect(results.map(({ emoji: name }) => name)).to.deep.equal(['handshake_tone1']);
			expect(recentEmojis).to.deep.equal(['smile']);
			expect(updates).to.deep.equal([['smile']]);
		});
	});

	describe('createEmojiList', () => {
		const originalPackages = emoji.packages;
		const originalList = emoji.list;

		beforeEach(() => {
			emoji.packages = {};
			emoji.list = {};
		});

		afterEach(() => {
			emoji.packages = originalPackages;
			emoji.list = originalList;
		});

		it('skips a native emoji that a custom emoji of the same name overrides', () => {
			emoji.packages.native = fakePackage({ people: ['grin', 'smile'] }, (name) => `<native>${name}</native>`);
			emoji.packages.emojiCustom = fakePackage({ [CUSTOM_CATEGORY]: ['smile'] }, (name) => `<custom>${name}</custom>`);
			emoji.list[':grin:'] = { emojiPackage: 'native' } as any;
			emoji.list[':smile:'] = { emojiPackage: 'emojiCustom' } as any;

			expect(listEmojiNames(createEmojiList(10, 'people', 0, [], () => undefined))).to.deep.equal(['grin']);
		});

		it('skips an emoji its own package cannot render a picker image for', () => {
			emoji.packages.native = fakePackage({ people: ['grin', 'broken'] }, (name) =>
				name === ':broken:' ? undefined : `<native>${name}</native>`,
			);
			emoji.list[':grin:'] = { emojiPackage: 'native' } as any;
			emoji.list[':broken:'] = { emojiPackage: 'native' } as any;

			expect(listEmojiNames(createEmojiList(10, 'people', 0, [], () => undefined))).to.deep.equal(['grin']);
		});

		it('appends a load more item when the custom emoji limit truncates the category', () => {
			emoji.packages.emojiCustom = fakePackage({ [CUSTOM_CATEGORY]: ['one', 'two', 'three'] }, (name) => `<custom>${name}</custom>`);
			['one', 'two', 'three'].forEach((name) => {
				emoji.list[`:${name}:`] = { emojiPackage: 'emojiCustom' } as any;
			});

			const rows = createEmojiList(2, CUSTOM_CATEGORY, 0, [], () => undefined);

			expect(listEmojiNames(rows)).to.deep.equal(['one', 'two']);
			expect(rows.some(isLoadMore)).to.be.true;
		});

		it('does not append a load more item when the limit matches the whole category', () => {
			emoji.packages.emojiCustom = fakePackage({ [CUSTOM_CATEGORY]: ['one', 'two', 'three'] }, (name) => `<custom>${name}</custom>`);
			['one', 'two', 'three'].forEach((name) => {
				emoji.list[`:${name}:`] = { emojiPackage: 'emojiCustom' } as any;
			});

			const rows = createEmojiList(3, CUSTOM_CATEGORY, 0, [], () => undefined);

			expect(listEmojiNames(rows)).to.deep.equal(['one', 'two', 'three']);
			expect(rows.some(isLoadMore)).to.be.false;
		});

		it('drops a recent emoji that no longer exists and notifies the caller', () => {
			emoji.packages.base = fakePackage({ recent: ['deletedcustom'] }, (name) => `<custom>${name}</custom>`);
			const recentEmojis = ['deletedcustom'];
			const updates: string[][] = [];

			const rows = createEmojiList(10, 'recent', 0, recentEmojis, (emojis) => updates.push([...emojis]));

			expect(listEmojiNames(rows)).to.be.empty;
			expect(recentEmojis).to.be.empty;
			expect(updates).to.deep.equal([[]]);
		});
	});

	describe('base package picker rendering', () => {
		const originalPackages = emoji.packages;
		const originalList = emoji.list;

		beforeEach(() => {
			emoji.packages = { base: originalPackages.base };
			emoji.list = {};
		});

		afterEach(() => {
			emoji.packages = originalPackages;
			emoji.list = originalList;
		});

		it('delegates to the package that owns the emoji', () => {
			emoji.packages.emojiCustom = fakePackage({}, (name) => `<custom>${name}</custom>`);
			emoji.list[':partyparrot:'] = { emojiPackage: 'emojiCustom' } as any;

			expect(emoji.packages.base.renderPicker(':partyparrot:')).to.equal('<custom>:partyparrot:</custom>');
		});

		it('renders nothing when the emoji has no package', () => {
			emoji.list[':orphan:'] = { emojiPackage: '' } as any;

			expect(emoji.packages.base.renderPicker(':orphan:')).to.be.undefined;
		});

		it('renders nothing when the package the emoji points to is gone', () => {
			emoji.list[':ghost:'] = { emojiPackage: 'uninstalled' } as any;

			expect(emoji.packages.base.renderPicker(':ghost:')).to.be.undefined;
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
