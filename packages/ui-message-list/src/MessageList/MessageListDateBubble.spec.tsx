import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';

import MessageListDateBubble from './MessageListDateBubble';
import type { MessageListScrollContextValue } from './MessageListScrollContext';
import { MessageListScrollContext } from './MessageListScrollContext';
import type { DateBubbleStore } from './scroll/dateBubbleStore';
import { createDateBubbleStore } from './scroll/dateBubbleStore';

const wrapper = mockAppRoot().withSetting('Message_DateFormat', 'YYYY/MM/DD').build();

const monday = new Date(2024, 0, 15, 10);

const Bubble = ({ store, overlayTopInset = 0 }: { store: DateBubbleStore; overlayTopInset?: number }) => {
	const value: MessageListScrollContextValue = {
		hasNewMessages: false,
		hasNewerMessages: false,
		dateBubbleStore: store,
		overlayTopInset,
		scrollToBottom: jest.fn(),
	};
	return (
		<MessageListScrollContext.Provider value={value}>
			<MessageListDateBubble />
		</MessageListScrollContext.Provider>
	);
};

const bubble = () => screen.getByText('2024/01/15').closest<HTMLElement>('[data-visible]') as HTMLElement;

describe('the floating date', () => {
	it("shows the day the list gives it in the viewer's date format, and hides when the list says so (R51)", () => {
		const store = createDateBubbleStore();
		render(<Bubble store={store} />, { wrapper });

		act(() => store.set({ date: monday, isVisible: true, offset: 0 }));
		expect(bubble()).toHaveAttribute('data-visible', 'true');

		act(() => store.set({ date: monday, isVisible: false, offset: 0 }));
		expect(bubble()).toHaveAttribute('data-visible', 'false');
	});

	it('moves up as far as the next day pushes it (R51)', () => {
		const store = createDateBubbleStore();
		render(<Bubble store={store} />, { wrapper });

		act(() => store.set({ date: monday, isVisible: true, offset: -12 }));
		expect(bubble().style.getPropertyValue('--date-bubble-offset')).toBe('-12px');

		act(() => store.set({ date: monday, isVisible: true, offset: 0 }));
		expect(bubble().style.getPropertyValue('--date-bubble-offset')).toBe('0px');
	});

	it('rests below what the consumer draws over the top of the list (R85)', () => {
		const store = createDateBubbleStore();
		const { rerender } = render(<Bubble store={store} overlayTopInset={60} />, { wrapper });

		act(() => store.set({ date: monday, isVisible: true, offset: 0 }));
		expect(bubble().style.getPropertyValue('--date-bubble-inset')).toBe('60px');

		rerender(<Bubble store={store} overlayTopInset={0} />);
		expect(bubble().style.getPropertyValue('--date-bubble-inset')).toBe('0px');
	});

	it('is hidden from assistive technology (R51)', () => {
		const store = createDateBubbleStore();
		render(<Bubble store={store} />, { wrapper });

		act(() => store.set({ date: monday, isVisible: true, offset: 0 }));
		expect(bubble()).toHaveAttribute('aria-hidden', 'true');
	});

	it('shows nothing before the list gives it a day (R51)', () => {
		render(<Bubble store={createDateBubbleStore()} />, { wrapper });

		expect(screen.queryByText(/2024/)).not.toBeInTheDocument();
	});
});
