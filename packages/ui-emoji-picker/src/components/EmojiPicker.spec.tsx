import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContextType, ReactNode } from 'react';
import { act, useState } from 'react';
import type { ListRange } from 'react-virtuoso';

import EmojiPicker from './EmojiPicker';
import { EmojiPickerContext } from '../contexts/EmojiPickerContext';
import { EmojiRegistryContext } from '../contexts/EmojiRegistryContext';
import type { EmojiRegistryContextValue } from '../contexts/EmojiRegistryContext';
import type { CategoriesIndexes } from '../lib/emoji';

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

const emojiPackage = (key: string, i18n: 'Frequently_Used' | 'Smileys_and_People' | 'Custom', categoryIndex?: number) => ({
	emojiCategories: [{ key, i18n }],
	categoryIndex,
	emojisByCategory: { [key]: [] },
	toneList: {},
	render: (message: string) => message,
	renderPicker: () => undefined,
});

const registry: EmojiRegistryContextValue = {
	packages: {
		base: emojiPackage('recent', 'Frequently_Used', 0),
		native: emojiPackage('people', 'Smileys_and_People'),
		emojiCustom: emojiPackage('rocket', 'Custom'),
	},
	list: {},
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

	return (
		<EmojiRegistryContext.Provider value={registry}>
			<EmojiPickerContext.Provider value={value}>{children}</EmojiPickerContext.Provider>
		</EmojiRegistryContext.Provider>
	);
};

const renderPicker = () => {
	const appRoot = mockAppRoot()
		.wrap((children) => <EmojiPickerFixture>{children}</EmojiPickerFixture>)
		.build();

	return render(
		<EmojiPicker
			reference={document.createElement('div')}
			onClose={() => undefined}
			onPickEmoji={() => undefined}
			onAddCustomEmoji={() => undefined}
		/>,
		{ wrapper: appRoot },
	);
};

const scrollTo = (range: ListRange) => act(() => mockVirtuoso.rangeChanged?.(range));

// the picker sits in a dropdown that jsdom cannot position, which keeps every tab out of the accessibility
// tree and leaves it with no accessible name, so the tabs are matched on their label attribute instead
const categoryTabs = () => screen.getAllByRole('tab', { hidden: true });

const categoryTab = (label: string) => {
	const tab = categoryTabs().find((candidate) => candidate.getAttribute('aria-label') === label);

	if (!tab) {
		throw new Error(`no category tab labelled ${label}`);
	}

	return tab;
};

const selectedCategory = () =>
	categoryTabs()
		.find((tab) => tab.getAttribute('aria-selected') === 'true')
		?.getAttribute('aria-label');

describe('EmojiPicker', () => {
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

	it('should activate a category picked from the header even when the list cannot scroll', async () => {
		renderPicker();

		await userEvent.click(categoryTab('Custom'));

		expect(selectedCategory()).toBe('Custom');
	});
});
