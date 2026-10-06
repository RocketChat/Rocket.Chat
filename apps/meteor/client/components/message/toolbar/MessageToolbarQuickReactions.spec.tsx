import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageToolbarQuickReactions from './MessageToolbarQuickReactions';

jest.mock('../../../contexts/EmojiPickerContext', () => ({
	usePreviewEmoji: () => ({ emojiToPreview: null, handlePreview: jest.fn(), handleRemovePreview: jest.fn() }),
}));

const reactions = Array.from({ length: 10 }, (_, index) => ({ emoji: `emoji_${index}`, image: `<span>${index}</span>` }));

const SLOT_WIDTH = 28;
const SLOTS_IN_TOOLBAR = 3;
const HOVER_INTENT_DELAY = 150;

const getRenderedEmojis = () => screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));

const setup = () => {
	const onReact = jest.fn();
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

	render(<MessageToolbarQuickReactions reactions={reactions} onReact={onReact} />);

	return { onReact, user };
};

beforeEach(() => {
	jest.useFakeTimers();
	jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: SLOT_WIDTH } as DOMRect);
	jest.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(SLOT_WIDTH * SLOTS_IN_TOOLBAR);
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('MessageToolbarQuickReactions', () => {
	it('should show the first five reactions', () => {
		setup();

		expect(getRenderedEmojis()).toEqual(['emoji_0', 'emoji_1', 'emoji_2', 'emoji_3', 'emoji_4']);
	});

	it('should open a line with as many of the remaining reactions as fit while they are hovered', async () => {
		const { user } = setup();

		await user.hover(screen.getByRole('button', { name: 'emoji_2' }));
		act(() => jest.advanceTimersByTime(HOVER_INTENT_DELAY));

		expect(getRenderedEmojis()).toEqual(['emoji_0', 'emoji_1', 'emoji_2', 'emoji_3', 'emoji_4', 'emoji_5', 'emoji_6', 'emoji_7']);

		await user.unhover(screen.getByRole('button', { name: 'emoji_2' }));
		act(() => jest.advanceTimersByTime(HOVER_INTENT_DELAY));

		expect(getRenderedEmojis()).toHaveLength(5);
	});

	it('should not open the line when the pointer only passes over the reactions', async () => {
		const { user } = setup();

		await user.hover(screen.getByRole('button', { name: 'emoji_2' }));
		await user.unhover(screen.getByRole('button', { name: 'emoji_2' }));
		act(() => jest.advanceTimersByTime(HOVER_INTENT_DELAY));

		expect(getRenderedEmojis()).toHaveLength(5);
	});

	it('should react with an emoji from the opened line', async () => {
		const { user, onReact } = setup();

		await user.hover(screen.getByRole('button', { name: 'emoji_0' }));
		act(() => jest.advanceTimersByTime(HOVER_INTENT_DELAY));
		await user.click(screen.getByRole('button', { name: 'emoji_6' }));

		expect(onReact).toHaveBeenCalledWith('emoji_6');
	});

	it('should open the line for keyboard users and close it on Escape, keeping the focus on the reactions', async () => {
		// jsdom never matches :focus-visible, so stand in for a browser that saw keyboard navigation
		const { matches } = Element.prototype;
		jest.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selectors: string) {
			return selectors === ':focus-visible' ? this === document.activeElement : matches.call(this, selectors);
		});

		const { user } = setup();

		await user.tab();

		expect(getRenderedEmojis()).toHaveLength(8);

		screen.getByRole('button', { name: 'emoji_5' }).focus();
		await user.keyboard('{Escape}');

		expect(getRenderedEmojis()).toHaveLength(5);
		expect(screen.getByRole('button', { name: 'emoji_0' })).toHaveFocus();
	});
});
