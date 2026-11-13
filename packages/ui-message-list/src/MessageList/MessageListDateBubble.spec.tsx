import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';

import MessageListDateBubble from './MessageListDateBubble';
import type { MessageListScrollContextValue } from './MessageListScrollContext';
import { MessageListScrollContext } from './MessageListScrollContext';

const wrapper = mockAppRoot().withSetting('Message_DateFormat', 'YYYY/MM/DD').build();

const scroll = (overrides: Partial<MessageListScrollContextValue> = {}): MessageListScrollContextValue => ({
	hasNewMessages: false,
	hasNewerMessages: false,
	isUserScrolling: false,
	dateBubble: { date: new Date(2024, 0, 15, 10), isCovered: false },
	scrollToBottom: jest.fn(),
	...overrides,
});

const Bubble = (overrides: Partial<MessageListScrollContextValue>) => (
	<MessageListScrollContext.Provider value={scroll(overrides)}>
		<MessageListDateBubble />
	</MessageListScrollContext.Provider>
);

const visibility = () => screen.getByText('2024/01/15').closest('[data-visible]');

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('the floating date', () => {
	it("shows the day in the viewer's date format only while the viewer scrolls and a second after (R51)", () => {
		const { rerender } = render(<Bubble />, { wrapper });
		expect(visibility()).toHaveAttribute('data-visible', 'false');

		rerender(<Bubble isUserScrolling />);
		expect(visibility()).toHaveAttribute('data-visible', 'true');

		rerender(<Bubble />);
		act(() => jest.advanceTimersByTime(999));
		expect(visibility()).toHaveAttribute('data-visible', 'true');

		act(() => jest.advanceTimersByTime(1));
		expect(visibility()).toHaveAttribute('data-visible', 'false');
	});

	it('is hidden from assistive technology (R51)', () => {
		render(<Bubble isUserScrolling />, { wrapper });

		expect(visibility()).toHaveAttribute('aria-hidden', 'true');
	});

	it('hides while a divider or the start of the conversation already shows the day (R52)', () => {
		const { rerender } = render(<Bubble isUserScrolling dateBubble={{ date: new Date(2024, 0, 15, 10), isCovered: true }} />, { wrapper });
		expect(visibility()).toHaveAttribute('data-visible', 'false');

		rerender(<Bubble isUserScrolling />);
		expect(visibility()).toHaveAttribute('data-visible', 'true');
	});

	it('shows nothing before the list reports a day (R51)', () => {
		render(<Bubble isUserScrolling dateBubble={undefined} />, { wrapper });

		expect(screen.queryByText(/2024/)).not.toBeInTheDocument();
	});
});
