import { Markup } from '@rocket.chat/gazzodown';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import GazzodownText from './GazzodownText';
import { useMessageListHighlights } from './message/list/MessageListContext';

jest.mock('@rocket.chat/ui-client', () => ({
	useFeaturePreview: () => false,
}));
jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useLocalStorage: () => ['en', jest.fn()],
}));
jest.mock('./message/list/MessageListContext', () => ({
	useMessageListHighlights: jest.fn(),
}));
jest.mock('../lib/utils/fireGlobalEvent', () => ({
	fireGlobalEvent: jest.fn(),
}));
jest.mock('../views/room/hooks/useGoToRoom', () => ({
	useGoToRoom: jest.fn(),
}));

const mockUseMessageListHighlights = useMessageListHighlights as jest.MockedFunction<typeof useMessageListHighlights>;

const wrapper = mockAppRoot().withUserPreference('useEmojis', true).withSetting('UI_Use_Real_Name', false).withJohnDoe();

const HighlightTester = ({ text }: { text: string }) => {
	return (
		<Markup
			tokens={[
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: text }],
				},
			]}
		/>
	);
};

describe('GazzodownText highlights', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should highlight Russian word "тест" in the middle of a sentence', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'тест' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='Это тест сообщения' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		// Expect that the highlighted element wraps exactly "тест"
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^тест$/i);
	});

	it('should highlight Russian word "тест" at the beginning of a sentence', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'тест' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='Тест сообщения' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^тест$/i);
	});

	it('should not highlight "тест" when it is part of a larger word', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'тест' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='Тестирование сообщения' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		expect(screen.queryByTitle('Highlighted_chosen_word')).not.toBeInTheDocument();
	});

	it('should highlight Russian word "тест" at the end of a sentence', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'тест' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='Сообщение тест' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^тест$/i);
	});

	it('should highlight English word "test" regardless of its position', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='This is a test message' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^test$/i);
	});

	it('should highlight all occurrences of the highlighted word in different positions', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='test is at the beginning, in the middle test, and at the end test' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		const highlightedElements = screen.getAllByTitle('Highlighted_chosen_word');
		// Expect three separate highlights.
		expect(highlightedElements.length).toBe(3);
		highlightedElements.forEach((el) => {
			expect(el).toHaveTextContent(/^test$/i);
		});
	});

	it('should highlight the highlighted word in a multiline text', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }] as any);

		const multilineText = `First line
Test line
Another line with test
in it.`;

		render(
			<GazzodownText>
				<HighlightTester text={multilineText} />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		const highlightedElements = screen.getAllByTitle('Highlighted_chosen_word');
		// At least two occurrences are expected: one for "Test" (capitalized) and one for "test"
		expect(highlightedElements.length).toBeGreaterThanOrEqual(2);
		// Verify that the highlighted texts match "test" (case-insensitive)
		highlightedElements.forEach((el) => {
			expect(el.textContent).toMatch(/^test$/i);
		});
	});

	it('should highlight highlighted word when surrounded by colons', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='This is :test: inside colons' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		// The highlighted element should contain only "test"
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^test$/i);
	});

	it('should highlight highlighted word when colon is at the start', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='This is :test with colon at the start' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		// The highlighted element should contain only "test"
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^test$/i);
	});

	it('should highlight highlighted word when colon is at the end', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='This is test: with colon at end' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		// The highlighted element should contain only "test"
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^test$/i);
	});

	it('should highlight multiple different highlighted words in the same text', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'test' }, { highlight: 'highlight' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='This test message should highlight the word highlight in multiple places: test and highlight.' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);

		const highlightedElements = screen.getAllByTitle('Highlighted_chosen_word');

		expect(highlightedElements.length).toBe(5);
		const texts = highlightedElements.map((el) => el.textContent?.toLowerCase());
		expect(texts).toEqual(expect.arrayContaining(['test', 'highlight']));
	});

	it('should highlight a word containing special characters like "-", "_", ".", "/", "=", "!", ":', () => {
		// The highlight word includes special characters.
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'te-st_te.st/te=te!st:' }] as any);

		const testText = 'This message contains te-st_te.st/te=te!st: as a highlighted word.';
		render(
			<GazzodownText>
				<HighlightTester text={testText} />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);

		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^te-st_te\.st\/te=te!st:$/i);
	});

	it('should highlight the word in a case-insensitive manner', () => {
		mockUseMessageListHighlights.mockReturnValue([{ highlight: 'Test' }] as any);

		render(
			<GazzodownText>
				<HighlightTester text='This is a test message' />
			</GazzodownText>,
			{ legacyRoot: true, wrapper: wrapper.build() },
		);
		expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent(/^test$/i);
	});
});
