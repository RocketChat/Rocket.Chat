import { createEmojiPopupConfig } from './emojiPopupConfig';
import { emoji } from '../../../app/emoji/client';

const search = async (filter: string, recents: string[] = []) => {
	const config = createEmojiPopupConfig({ t: ((key: string) => key) as never, recentEmojis: recents });
	const items = (await config.getItemsFromLocal?.(filter)) ?? [];
	return items.map(({ _id }) => _id);
};

beforeAll(() => {
	emoji.packages.test = {
		emojisByCategory: {},
		toneList: {},
		render: () => '',
		renderPicker: () => undefined,
	} as never;

	const handles = [
		':rocket:',
		':smile:',
		':smiley:',
		':sweat_smile:',
		':thumbsup:',
		':thumbsup_tone1:',
		':thumbsup_tone5:',
		...Array.from({ length: 15 }, (_, i) => `:cat${i}:`),
	];
	for (const handle of handles) {
		emoji.list[handle] = { emojiPackage: 'test' } as never;
	}
});

describe('createEmojiPopupConfig search', () => {
	it('matches substrings case-insensitively', async () => {
		expect(await search('SMILE')).toEqual(expect.arrayContaining([':smile:', ':smiley:', ':sweat_smile:']));
	});

	it('ranks exact/prefix matches before substring matches', async () => {
		const results = await search('smile');
		expect(results[0]).toBe(':smile:');
		expect(results.indexOf(':sweat_smile:')).toBeGreaterThan(0);
	});

	it('boosts recently used emojis', async () => {
		expect((await search('smile', ['smiley']))[0]).toBe(':smiley:');
	});

	it('hides skin tone variants unless explicitly searched', async () => {
		expect(await search('thumbsup')).toEqual([':thumbsup:']);
	});

	it('includes skin tone variants when the search asks for a tone', async () => {
		expect(await search('thumbsup_tone')).toEqual(expect.arrayContaining([':thumbsup_tone1:', ':thumbsup_tone5:']));
	});

	it('limits the number of suggestions', async () => {
		expect((await search('cat')).length).toBeLessThanOrEqual(10);
	});
});
