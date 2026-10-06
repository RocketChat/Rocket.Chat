import { createEmojiList, getEmojiWithTone, getQuickReactions } from './helpers';
import { emoji } from './lib';
import { SUGGESTED_CATEGORY } from './suggested';

const entry = (emojiPackage: string) => ({
	emojiPackage,
	category: '',
	shortnames: [],
	uc_base: '',
	uc_greedy: '',
	uc_match: '',
	uc_output: '',
});

const render = (packageName: string) => (emojiToRender: string) => `<${packageName}>${emojiToRender}</${packageName}>`;

beforeEach(() => {
	emoji.packages.native = {
		emojiCategories: [{ key: 'people', i18n: 'Smileys_and_People' }],
		emojisByCategory: { people: ['thumbsup', 'eyes'] },
		toneList: { thumbsup: 1 },
		render: render('native'),
		renderPicker: render('native'),
	};
	emoji.packages.emojiCustom = {
		emojiCategories: [{ key: 'rocket', i18n: 'Custom' }],
		emojisByCategory: { rocket: ['party_parrot'] },
		toneList: {},
		render: render('custom'),
		renderPicker: render('custom'),
	};
	emoji.list = {
		':thumbsup:': entry('native'),
		':thumbsup_tone2:': entry('native'),
		':eyes:': entry('native'),
		':party_parrot:': entry('emojiCustom'),
	};
	emoji.packages.base.emojisByCategory.recent = [];
	emoji.packages.base.emojisByCategory[SUGGESTED_CATEGORY] = ['eyes', 'thumbsup', 'deleted_custom_emoji'];
});

describe('getEmojiWithTone', () => {
	it('should add the tone to emojis that support it', () => {
		expect(getEmojiWithTone('thumbsup', 2)).toBe('thumbsup_tone2');
	});

	it('should keep emojis without tones as they are', () => {
		expect(getEmojiWithTone('eyes', 2)).toBe('eyes');
	});

	it('should not add a tone when none is selected', () => {
		expect(getEmojiWithTone('thumbsup', 0)).toBe('thumbsup');
	});

	it('should not add a tone to a custom emoji overriding a native one', () => {
		emoji.list[':thumbsup:'] = entry('emojiCustom');

		expect(getEmojiWithTone('thumbsup', 2)).toBe('thumbsup');
	});
});

describe('getQuickReactions', () => {
	it('should list the frequent emojis first, then the suggested ones in the selected tone', () => {
		expect(getQuickReactions(['party_parrot', 'eyes'], 2)).toEqual([
			{ emoji: 'party_parrot', image: '<custom>:party_parrot:</custom>' },
			{ emoji: 'eyes', image: '<native>:eyes:</native>' },
			{ emoji: 'thumbsup_tone2', image: '<native>:thumbsup_tone2:</native>' },
		]);
	});

	it('should leave out emojis that no longer exist', () => {
		expect(getQuickReactions(['deleted_frequent_emoji'], 0).map(({ emoji }) => emoji)).toEqual(['eyes', 'thumbsup']);
	});
});

describe('createEmojiList', () => {
	it('should render the suggested emojis in the selected tone, skipping the ones that no longer exist', () => {
		const setRecentEmojis = jest.fn();

		const [row] = createEmojiList(90, SUGGESTED_CATEGORY, 2, [], setRecentEmojis);

		expect(row).toEqual([
			{ emoji: 'eyes', image: '<native>:eyes:</native>', category: SUGGESTED_CATEGORY },
			{ emoji: 'thumbsup', image: '<native>:thumbsup_tone2:</native>', category: SUGGESTED_CATEGORY },
		]);
		expect(setRecentEmojis).not.toHaveBeenCalled();
	});

	it('should render recent emojis as they were picked', () => {
		emoji.packages.base.emojisByCategory.recent = ['thumbsup'];

		const [row] = createEmojiList(90, 'recent', 2, ['thumbsup'], jest.fn());

		expect(row).toEqual([{ emoji: 'thumbsup', image: '<native>:thumbsup:</native>', category: 'recent' }]);
	});

	it('should drop recent emojis that no longer exist and keep rendering the rest', () => {
		const recentEmojis = ['deleted_custom_emoji', 'eyes'];
		emoji.packages.base.emojisByCategory.recent = [...recentEmojis];
		const setRecentEmojis = jest.fn();

		const [row] = createEmojiList(90, 'recent', 0, recentEmojis, setRecentEmojis);

		expect(row).toEqual([{ emoji: 'eyes', image: '<native>:eyes:</native>', category: 'recent' }]);
		expect(setRecentEmojis).toHaveBeenCalledWith(['eyes']);
	});
});
