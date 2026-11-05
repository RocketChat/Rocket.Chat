import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ContextType, ReactNode } from 'react';
import { act, useState } from 'react';
import type { ListRange } from 'react-virtuoso';

import EmojiPicker from './EmojiPicker';
import { EmojiPickerContext } from '../../../contexts/EmojiPickerContext';
import type { CategoriesIndexes } from '../../../lib/emoji';
import { emoji } from '../../../lib/emoji/lib';

const mockVirtuoso: { rangeChanged?: (range: ListRange) => void } = {};

jest.mock('react-virtuoso', () => ({
	Virtuoso: ({ rangeChanged }: { rangeChanged: (range: ListRange) => void }) => {
		mockVirtuoso.rangeChanged = rangeChanged;
		return <div />;
	},
}));

const categoriesIndexes: CategoriesIndexes = [
	{ key: 'recent', index: 0 },
	{ key: 'people', index: 10 },
	{ key: 'rocket', index: 25 },
];

const registerPackages = () => {
	emoji.packages.native = {
		emojiCategories: [{ key: 'people', i18n: 'Smileys_and_People' }],
		emojisByCategory: { people: [] },
		toneList: {},
		render: (message: string) => message,
		renderPicker: () => undefined,
	};

	emoji.packages.emojiCustom = {
		emojiCategories: [{ key: 'rocket', i18n: 'Custom' }],
		emojisByCategory: { rocket: [] },
		toneList: {},
		render: (message: string) => message,
		renderPicker: () => undefined,
	};
};

const EmojiPickerFixture = ({ children }: { children: ReactNode }) => {
	const [currentCategory, setCurrentCategory] = useState('');

	const value: ContextType<typeof EmojiPickerContext> = {
		currentCategory,
		setCurrentCategory,
		categoriesIndexes,
		emojiListByCategory: [],
		recentEmojis: [],
		setRecentEmojis: () => undefined,
		addRecentEmoji: () => undefined,
		actualTone: 0,
		setActualTone: () => undefined,
		customItemsLimit: 90,
		setCustomItemsLimit: () => undefined,
		quickReactions: [],
		emojiToPreview: null,
		handlePreview: () => undefined,
		handleRemovePreview: () => undefined,
		open: () => undefined,
		isOpen: true,
		close: () => undefined,
	};

	return <EmojiPickerContext.Provider value={value}>{children}</EmojiPickerContext.Provider>;
};

const renderPicker = () => {
	const appRoot = mockAppRoot()
		.wrap((children) => <EmojiPickerFixture>{children}</EmojiPickerFixture>)
		.build();

	return render(<EmojiPicker reference={document.createElement('div')} onClose={() => undefined} onPickEmoji={() => undefined} />, {
		wrapper: appRoot,
	});
};

const scrollTo = (range: ListRange) => act(() => mockVirtuoso.rangeChanged?.(range));

// the picker sits in a dropdown that jsdom cannot position, which keeps every tab out of the accessibility tree
const selectedCategory = () =>
	screen
		.getAllByRole('tab', { hidden: true })
		.find((tab) => tab.getAttribute('aria-selected') === 'true')
		?.getAttribute('aria-label');

describe('EmojiPicker', () => {
	beforeAll(registerPackages);

	it('should start on the first category', () => {
		renderPicker();

		expect(selectedCategory()).toBe('Frequently_Used');
	});

	it('should activate the last category once its divider is on screen', () => {
		renderPicker();

		scrollTo({ startIndex: 11, endIndex: 26 });

		expect(selectedCategory()).toBe('Custom');
	});

	it('should activate the category the first visible row belongs to', () => {
		renderPicker();

		scrollTo({ startIndex: 5, endIndex: 20 });

		expect(selectedCategory()).toBe('Frequently_Used');
	});
});
