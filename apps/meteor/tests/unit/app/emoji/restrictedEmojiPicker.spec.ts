import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';

import { emoji } from '../../../../client/lib/emoji/lib';

const { createEmojiList, getEmojisBySearchTerm } = proxyquire('../../../../client/lib/emoji/helpers.ts', {
	'@rocket.chat/tools': {
		escapeRegExp: (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
	},
});

const CATEGORY = 'people-test';

describe('restricted emoji picker filtering', () => {
	const recentEmojis: string[] = [];
	const setRecentEmojis = (): void => undefined;

	beforeEach(() => {
		emoji.packages.testPkg = {
			emojisByCategory: {
				[CATEGORY]: ['smile', 'eggplant', 'peach'],
			},
			toneList: {},
			renderPicker: () => '<img />',
		} as any;

		emoji.list[':smile:'] = { emojiPackage: 'testPkg' } as any;
		emoji.list[':eggplant:'] = { emojiPackage: 'testPkg' } as any;
		emoji.list[':peach:'] = { emojiPackage: 'testPkg' } as any;
	});

	afterEach(() => {
		delete emoji.packages.testPkg;
		delete emoji.list[':smile:'];
		delete emoji.list[':eggplant:'];
		delete emoji.list[':peach:'];
	});

	const flattenEmojis = (rows: ReturnType<typeof createEmojiList>): string[] =>
		rows.flatMap((row) => {
			if (!Array.isArray(row)) {
				return [];
			}

			return row.map((item) => item.emoji);
		});

	it('should hide restricted emojis from the picker for regular users', () => {
		const rows = createEmojiList(90, CATEGORY, 0, recentEmojis, setRecentEmojis, false, ['eggplant', 'peach']);
		expect(flattenEmojis(rows)).to.deep.equal(['smile']);
	});

	it('should keep restricted emojis visible for users with manage-emoji', () => {
		const rows = createEmojiList(90, CATEGORY, 0, recentEmojis, setRecentEmojis, true, ['eggplant', 'peach']);
		expect(flattenEmojis(rows)).to.deep.equal(['smile', 'eggplant', 'peach']);
	});

	it('should hide restricted emojis from search results for regular users', () => {
		const results = getEmojisBySearchTerm('pea', 0, recentEmojis, setRecentEmojis, false, ['peach']);
		expect(results.map((item: { emoji: string }) => item.emoji)).to.not.include('peach');
	});

	it('should include restricted emojis in search results for users with manage-emoji', () => {
		const results = getEmojisBySearchTerm('pea', 0, recentEmojis, setRecentEmojis, true, ['peach']);
		expect(results.map((item: { emoji: string }) => item.emoji)).to.include('peach');
	});
});
