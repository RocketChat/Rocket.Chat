import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import MessageListPlayground, { MAIN_MESSAGE_ID } from './stories/MessageListPlayground';
import TwoRoomsPlayground from './stories/TwoRoomsPlayground';
import {
	distanceFromBottom,
	expectAtBottom,
	firstVisibleMessage,
	getViewport,
	messageOffset,
	messageRow,
	offsetFromCenter,
	recordShownFrames,
	userScrollBy,
	userScrollTo,
	waitFor,
	waitForListSettled,
} from './stories/playHelpers';
import { fakeMessageId } from './stories/useFakeMessageSource';

const readVisibility = (canvasElement: HTMLElement) =>
	JSON.parse(within(canvasElement).getByLabelText('Visibility').textContent || '{}') as {
		top?: string;
		isFirstUnreadVisible?: boolean;
		isAtBottom?: boolean;
	};

/** Settles the held loads, and the ones the list starts after them, until the list is no longer busy. */
const settleAllLoads = async (canvasElement: HTMLElement) => {
	const canvas = within(canvasElement);
	for (let round = 0; round < 5; round++) {
		await userEvent.click(canvas.getByRole('button', { name: 'Settle loads' }));
		await waitForListSettled(canvasElement);
		if (getViewport(canvasElement).getAttribute('aria-busy') === 'false') {
			return;
		}
	}
};

const meta = {
	title: 'Components/MessageList',
	component: MessageListPlayground,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Message_list: 'Message list',
				New_messages: 'New messages',
				Jump_to_recent_messages: 'Jump to recent messages',
				Unread_Messages: 'Unread messages',
			})
			.buildStoryDecorator(),
	],
	parameters: { layout: 'padded' },
	args: {
		history: { size: 60 },
		source: { latency: 200 },
	},
} satisfies Meta<typeof MessageListPlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

/** R13, R78: a conversation opens at its newest message. */
export const Default: Story = {
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(messageRow(canvasElement, fakeMessageId(59))).toBeInTheDocument();
		await expect(canvasElement.querySelector('.os-scrollbar')).not.toBeNull();
	},
};

/** R14: A list shorter than its viewport sits at the bottom, next to the composer. */
export const ShortList: Story = {
	args: { history: { size: 3 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const last = messageRow(canvasElement, fakeMessageId(2));
		await expect(Math.abs(viewport.getBoundingClientRect().bottom - (last?.getBoundingClientRect().bottom ?? 0))).toBeLessThanOrEqual(1);
	},
};

/** R5: a list with nothing in it renders no row and raises no error. */
export const Empty: Story = {
	args: { history: { size: 0 }, hasHeader: false },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByRole('list', { name: 'Message list' })).toBeInTheDocument();
	},
};

/** R30, R36: reaching the top loads older messages without moving what is on screen. */
export const InfiniteOlderHistory: Story = {
	args: { history: { size: 400, hasMixedHeights: true }, source: { pageSize: 30, latency: 150 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 400);
		const before = firstVisibleMessage(canvasElement);

		await userScrollTo(canvasElement, 60);
		const anchor = firstVisibleMessage(canvasElement);
		await waitFor(() => messageRow(canvasElement, fakeMessageId(369)) !== null);
		await waitForListSettled(canvasElement);

		const after = firstVisibleMessage(canvasElement);
		await expect(after.id).toBe(anchor.id);
		await expect(Math.abs(after.top - anchor.top)).toBeLessThanOrEqual(1);
		await expect(before.id).not.toBe(anchor.id);
	},
};

/** R15, R22: new messages keep a list at the bottom at the bottom. */
export const LiveIncomingAtBottom: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitFor(() => messageRow(canvasElement, fakeMessageId(60)) !== null);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(canvas.getByText('New messages').closest('[data-visible]')).toHaveAttribute('data-visible', 'false');
	},
};

/** R18, R21, R23: a message arriving while scrolled up shows "New messages", which takes the viewer down. */
export const LiveIncomingScrolledUp: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollBy(canvasElement, -600);
		const reading = firstVisibleMessage(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitForListSettled(canvasElement);
		await expect(firstVisibleMessage(canvasElement)).toEqual(reading);

		const button = canvas.getByText('New messages');
		await expect(button.closest('[data-visible]')).toHaveAttribute('data-visible', 'true');
		await userEvent.click(button);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(button.closest('[data-visible]')).toHaveAttribute('data-visible', 'false');
	},
};

/** R19, R20: the viewer's own message takes them to it, even from an older window of the conversation. */
export const SendOwnMessageWhileDetached: Story = {
	args: {
		history: { size: 300 },
		source: { pageSize: 30, latency: 150, initialWindow: { around: fakeMessageId(100) } },
		initialTargetIndex: 100,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Send own message' }));
		await waitFor(() => messageRow(canvasElement, fakeMessageId(300)) !== null);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
	},
};

/** R41, R42, R48: jumping to a loaded message centers and highlights it. */
export const JumpToLoadedMessage: Story = {
	args: { history: { size: 60 }, source: { pageSize: 60 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Jump to message 10' }));
		await waitForListSettled(canvasElement);
		await expect(Math.abs(offsetFromCenter(canvasElement, fakeMessageId(10)))).toBeLessThanOrEqual(1);
		await expect(messageRow(canvasElement, fakeMessageId(10))?.querySelector('.rcx-message--editing')).not.toBeNull();
	},
};

/** R42, R43: jumping to a message that is not loaded waits for the messages around it, then jumps. */
export const JumpToUnloadedMessage: Story = {
	args: { history: { size: 400 }, source: { pageSize: 30, latency: 300 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Jump to message 10' }));
		await waitFor(() => messageRow(canvasElement, fakeMessageId(10)) !== null);
		await waitForListSettled(canvasElement);
		await expect(Math.abs(offsetFromCenter(canvasElement, fakeMessageId(10)))).toBeLessThanOrEqual(1);
	},
};

/** R28, R44: the target stays centered while content around it resolves its height late. */
export const JumpSurvivesLateMeasurement: Story = {
	args: { history: { size: 120, hasMixedHeights: true }, source: { pageSize: 120 }, initialTargetIndex: 40 },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await waitFor(() =>
			Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-late-content]')).every((element) => element.offsetHeight > 0),
		);
		await waitForListSettled(canvasElement);
		await expect(Math.abs(offsetFromCenter(canvasElement, fakeMessageId(40)))).toBeLessThanOrEqual(1);
	},
};

/** R8, R47: the unread divider marks the first unread message, and the list can jump to it. */
export const JumpToFirstUnread: Story = {
	args: { history: { size: 80 }, source: { pageSize: 80, firstUnreadMessageId: fakeMessageId(30) } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Jump to first unread' }));
		await waitForListSettled(canvasElement);
		await expect(Math.abs(offsetFromCenter(canvasElement, fakeMessageId(30)))).toBeLessThanOrEqual(1);
		await expect(within(messageRow(canvasElement, fakeMessageId(30)) as HTMLElement).getByText('unread messages')).toBeInTheDocument();
	},
};

/** R24, R40: from an older window, reaching the bottom loads newer messages, and "Jump to recent messages" resets to the latest. */
export const JumpToLatest: Story = {
	args: {
		history: { size: 300 },
		source: { pageSize: 30, latency: 150, initialWindow: { around: fakeMessageId(100) } },
		initialTargetIndex: 100,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		const button = canvas.getByText('Jump to recent messages');
		await expect(button.closest('[data-visible]')).toHaveAttribute('data-visible', 'true');

		await userEvent.click(button);
		await waitFor(() => messageRow(canvasElement, fakeMessageId(299)) !== null);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
	},
};

/** R31: newer messages load at the bottom of an older window. */
export const LoadNewerAtBottom: Story = {
	args: {
		history: { size: 300 },
		source: { pageSize: 30, latency: 150, initialWindow: { around: fakeMessageId(100) } },
		initialTargetIndex: 100,
	},
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const { scrollHeight } = viewport;
		viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: scrollHeight, bubbles: true }));
		viewport.scrollTop = scrollHeight;
		await waitFor(() => viewport.scrollHeight > scrollHeight);
		await waitForListSettled(canvasElement);
		await expect(distanceFromBottom(viewport)).toBeGreaterThan(0);
	},
};

/** R15: content that grows after it is shown keeps a list at the bottom at the bottom. */
export const LateResizingContent: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive late-resizing message' }));
		await waitFor(() => (canvasElement.querySelector<HTMLElement>('[data-late-content]')?.offsetHeight ?? 0) > 0);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
	},
};

/** R16: a growing composer and a shrinking container keep a list at the bottom at the bottom. */
export const ContainerAndComposerResize: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Toggle composer height' }));
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Toggle container height' }));
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
	},
};

/** R60, R62: switching conversations brings each one back where it was left. */
export const RestorePosition: Story = {
	render: () => <TwoRoomsPlayground />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollBy(canvasElement, -900);
		const left = firstVisibleMessage(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Room B' }));
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Room A' }));
		await waitForListSettled(canvasElement);
		const restored = firstVisibleMessage(canvasElement);
		await expect(restored.id).toBe(left.id);
		await expect(Math.abs(restored.top - left.top)).toBeLessThanOrEqual(1);
	},
};

/** R61: a list that mounts before its messages arrive still opens where it was left. */
export const RestorePositionOfAListThatMountsEmpty: Story = {
	render: () => <TwoRoomsPlayground loadDelay={400} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => canvasElement.querySelector('[data-message-id]') !== null);
		await waitForListSettled(canvasElement);
		await userScrollBy(canvasElement, -900);
		const left = firstVisibleMessage(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Room B' }));
		await waitFor(() => canvasElement.querySelector('[data-message-id]') !== null);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Room A' }));
		await waitFor(() => canvasElement.querySelector('[data-message-id]') !== null);
		await waitForListSettled(canvasElement);
		const restored = firstVisibleMessage(canvasElement);
		await expect(restored.id).toBe(left.id);
		await expect(Math.abs(restored.top - left.top)).toBeLessThanOrEqual(1);
	},
};

/** R2, R37: the header shows once no older messages remain. */
export const StartOfConversationHeader: Story = {
	args: { history: { size: 40 }, source: { pageSize: 20, latency: 100 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await expect(canvasElement.querySelector('[data-qa="start-of-conversation"]')).toBeNull();

		await userScrollTo(canvasElement, 0);
		await waitFor(() => messageRow(canvasElement, fakeMessageId(0)) !== null || getViewport(canvasElement).scrollTop > 0);
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 0);
		await waitFor(() => canvasElement.querySelector('[data-qa="start-of-conversation"]') !== null);
	},
};

/** R11: A thread: replies grouped by author, the main message first, only the floating date over the list. */
export const ThreadLayout: Story = {
	args: { isThread: true, hasHeader: false, history: { size: 25 } },
};

/** R1, R3: loading the first page, then older pages: the spinner shows only while a page is on its way. */
export const LoadingStates: Story = {
	args: { history: { size: 200 }, source: { pageSize: 20, latency: 'manual', isInitiallyLoading: true } },
	play: async ({ canvasElement }) => {
		const viewport = getViewport(canvasElement);
		await expect(viewport).toHaveAttribute('aria-busy', 'true');
	},
};

/** R3, R4: while the first page loads and nothing is listed, a spinner at the top takes the place of every row. */
export const FirstPageLoading: Story = {
	args: { history: { size: 0 }, source: { latency: 'manual', isInitiallyLoading: true } },
	play: async ({ canvasElement }) => {
		const viewport = getViewport(canvasElement);
		await expect(viewport).toHaveAttribute('aria-busy', 'true');
		const spinner = canvasElement.querySelector('.rcx-throbber') as HTMLElement;
		await expect(spinner).not.toBeNull();
		// At the top, in a loader row as high as the room's and the thread's, where the older pages load, not at the bottom
		const loader = spinner.closest('[role="presentation"]') as HTMLElement;
		await expect(Math.abs(loader.getBoundingClientRect().height - 32)).toBeLessThanOrEqual(1);
		await expect(loader.getBoundingClientRect().top - viewport.getBoundingClientRect().top).toBeLessThanOrEqual(1);
		await expect(canvasElement.querySelector('[data-message-id]')).toBeNull();
		await expect(canvasElement.querySelector('[data-qa="start-of-conversation"]')).toBeNull();
	},
};

/** R29: a first page that arrives after the list stopped placing itself is placed before any page is due, so it opens at the bottom and loads nothing. */
export const FirstPageArrivesLate: Story = {
	args: { history: { size: 200 }, source: { pageSize: 30, firstPageDelay: 600 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await waitFor(() => messageRow(canvasElement, fakeMessageId(199)) !== null);
		await waitForListSettled(canvasElement);

		await expectAtBottom(canvasElement);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('0');
	},
};

/** R48: the target of a jump is highlighted for a while. */
export const HighlightedMessage: Story = {
	args: { history: { size: 40 }, source: { pageSize: 40 }, initialTargetIndex: 20 },
	play: async ({ canvasElement }) => {
		await waitFor(() => messageRow(canvasElement, fakeMessageId(20))?.querySelector('.rcx-message--editing') !== null);
	},
};

/** R51: every scroll shows the floating date, one the viewer does not make too, and it fades a second after the last one. */
export const FloatingDate: Story = {
	args: { history: { size: 120 }, source: { pageSize: 120 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const bubble = () => canvasElement.querySelector<HTMLElement>('[aria-hidden="true"][data-visible]');

		viewport.scrollTop -= 300;
		await waitFor(() => bubble()?.getAttribute('data-visible') === 'true');
		const shownAt = performance.now();
		// As `develop`'s `BubbleDate` fades
		await expect(getComputedStyle(bubble() as HTMLElement).transitionDuration).toBe('0.6s');
		await waitFor(() => bubble()?.getAttribute('data-visible') === 'false', 3000);
		await expect(performance.now() - shownAt).toBeGreaterThanOrEqual(900);
	},
};

/** R25: a scroll the browser makes does not release the bottom, and neither does a scroll key typed in a text field. */
export const TypingInAFieldKeepsTheBottom: Story = {
	args: { history: { size: 30 }, source: { pageSize: 30 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const host = viewport.closest<HTMLElement>('[data-anchor]') as HTMLElement;
		const field = document.createElement('input');
		viewport.appendChild(field);

		field.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
		viewport.scrollTop = 0;
		await waitFor(() => readVisibility(canvasElement).isAtBottom === false);
		await expect(host).toHaveAttribute('data-anchor', 'bottom');
		field.remove();
	},
};

/** R25: a scroll key releases the bottom. */
export const ScrollKeyReleasesTheBottom: Story = {
	args: { history: { size: 30 }, source: { pageSize: 30 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const host = viewport.closest<HTMLElement>('[data-anchor]') as HTMLElement;

		viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
		viewport.scrollTop = 0;
		await waitFor(() => host.dataset.anchor === 'none');
	},
};

/** R25: dragging the scrollbar releases the bottom. */
export const DraggingTheScrollbarReleasesTheBottom: Story = {
	args: { history: { size: 30 }, source: { pageSize: 30 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const host = viewport.closest<HTMLElement>('[data-anchor]') as HTMLElement;

		host.querySelector('.os-scrollbar')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		viewport.scrollTop = 0;
		await waitFor(() => host.dataset.anchor === 'none');
	},
};

/** R35: a page that fails to arrive settles, is not retried by itself, and is asked for again by the next scroll. */
export const FailedLoadSettles: Story = {
	args: { history: { size: 200 }, source: { pageSize: 20, latency: 100, failLoads: 1 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('0');

		await userScrollTo(canvasElement, 0);
		await waitFor(() => canvas.getByLabelText('Loads').textContent === '1');
		await waitFor(() => getViewport(canvasElement).getAttribute('aria-busy') === 'false');
		await waitForListSettled(canvasElement);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('1');

		await userScrollTo(canvasElement, 5);
		await waitFor(() => Number(canvas.getByLabelText('Loads').textContent) >= 2);
		await waitFor(() => getViewport(canvasElement).getAttribute('aria-busy') === 'false');
	},
};

/** R34: a viewport taller than a page keeps loading until it is full. */
export const FillsATallViewport: Story = {
	args: { history: { size: 300 }, source: { pageSize: 4, latency: 50 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => Number(canvas.getByLabelText('Loads').textContent) >= 1);
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const first = Array.from(viewport.querySelectorAll<HTMLElement>('[data-message-id]'))[0];
		await expect(first.getBoundingClientRect().top).toBeLessThanOrEqual(viewport.getBoundingClientRect().top + 1);
		await expect(viewport.querySelectorAll('[data-message-id]').length).toBeGreaterThan(4);
	},
};

/**
 * R30, R36: a page of older messages of the same day as the first one loaded takes the day divider, and here the author line,
 * off that message without moving what it says, and is the only page loaded while the viewer stays where the page left them.
 * All the messages fall on one day in the time zone the play runs in, whichever it is.
 */
export const OlderPageOfTheSameDay: Story = {
	args: {
		history: { size: 60, minutesApart: 1, endsAt: new Date(2024, 2, 10, 12, 0) },
		source: { pageSize: 20, latency: 'manual' },
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const dayDividerOf = (messageId: string) => messageRow(canvasElement, messageId)?.querySelector('[role="listitem"] .rcx-bubble');
		const endOf = (messageId: string) =>
			(messageRow(canvasElement, messageId) as HTMLElement).getBoundingClientRect().bottom -
			getViewport(canvasElement).getBoundingClientRect().top;
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 0);
		await waitFor(() => canvas.getByLabelText('Loads').textContent === '1');
		const reading = firstVisibleMessage(canvasElement);
		const end = endOf(reading.id);
		await expect(dayDividerOf(reading.id)).toBeTruthy();

		await settleAllLoads(canvasElement);

		await expect(dayDividerOf(reading.id)).toBeFalsy();
		await expect(Math.abs(endOf(reading.id) - end)).toBeLessThanOrEqual(1);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('1');
		await expect(getViewport(canvasElement)).toHaveAttribute('aria-busy', 'false');
	},
};

/** R37: the header takes the place of the loader, and grows after it showed, without moving what is on screen. */
export const HeaderReplacesTheLoader: Story = {
	args: { history: { size: 40 }, source: { pageSize: 20, latency: 'manual' } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 0);
		const reading = firstVisibleMessage(canvasElement);

		await settleAllLoads(canvasElement);
		await waitForListSettled(canvasElement);

		await expect(Math.abs(messageOffset(canvasElement, reading.id) - reading.top)).toBeLessThanOrEqual(1);

		await userScrollTo(canvasElement, 0);
		await waitFor(() => canvasElement.querySelector('[data-qa="start-of-conversation"]') !== null);
	},
};

/** thread-message-list R11: the main message takes the older loader's place without moving what is on screen. */
export const ThreadMainMessageReplacesLoader: Story = {
	args: { isThread: true, hasHeader: false, hasMainMessage: true, history: { size: 40 }, source: { pageSize: 20, latency: 'manual' } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 0);
		await expect(messageRow(canvasElement, MAIN_MESSAGE_ID)).toBeNull();
		const reading = firstVisibleMessage(canvasElement);

		await settleAllLoads(canvasElement);
		await waitForListSettled(canvasElement);

		await expect(Math.abs(messageOffset(canvasElement, reading.id) - reading.top)).toBeLessThanOrEqual(1);

		await userScrollTo(canvasElement, 0);
		await waitFor(() => messageRow(canvasElement, MAIN_MESSAGE_ID) !== null);
	},
};

/** R37: a header that grows after it showed does not move what is on screen. */
export const HeaderGrowsLate: Story = {
	args: { history: { size: 40 }, source: { pageSize: 40 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 150);
		const before = firstVisibleMessage(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Grow header' }));
		await waitForListSettled(canvasElement);

		const after = firstVisibleMessage(canvasElement);
		await expect(after.id).toBe(before.id);
		await expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
	},
};

/** R38: a message arriving in the same update as an older page moves nothing. */
export const LiveMessageWhileOlderLoads: Story = {
	args: { history: { size: 100 }, source: { pageSize: 30, latency: 'manual' } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 100);
		const reading = firstVisibleMessage(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive a message with the next page' }));
		await settleAllLoads(canvasElement);
		await waitForListSettled(canvasElement);

		const after = firstVisibleMessage(canvasElement);
		await expect(after.id).toBe(reading.id);
		await expect(Math.abs(after.top - reading.top)).toBeLessThanOrEqual(1);
	},
};

/** R39: a message that changes place in the middle of the list does not move what the viewer reads. */
export const ReorderedMessage: Story = {
	args: { history: { size: 100 }, source: { pageSize: 30 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollBy(canvasElement, -500);
		const reading = firstVisibleMessage(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Reorder a message' }));
		await waitForListSettled(canvasElement);

		const after = firstVisibleMessage(canvasElement);
		await expect(after.id).toBe(reading.id);
		await expect(Math.abs(after.top - reading.top)).toBeLessThanOrEqual(1);
	},
};

/** R69: "Select all" scrolls to the top and nothing takes the list back to the bottom. */
export const ScrollToTop: Story = {
	args: { history: { size: 30 }, source: { pageSize: 30 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Scroll to top' }));
		await waitForListSettled(canvasElement);
		await expect(getViewport(canvasElement).scrollTop).toBeLessThanOrEqual(1);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitForListSettled(canvasElement);
		await expect(getViewport(canvasElement).scrollTop).toBeLessThanOrEqual(1);
	},
};

/** R45: a list that mounts with a target opens centered on it, not at the bottom. */
export const OpensOnATarget: Story = {
	args: { history: { size: 60 }, source: { pageSize: 60 }, initialTargetIndex: 20 },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);

		await expect(Math.abs(offsetFromCenter(canvasElement, fakeMessageId(20)))).toBeLessThanOrEqual(1);
		await expect(distanceFromBottom(getViewport(canvasElement))).toBeGreaterThan(1);
	},
};

/** R64: a message with a file stays mounted far out of view, and one without does not. */
export const KeepsLiveEmbedsMounted: Story = {
	args: { history: { size: 200, liveEmbedAt: [10] }, source: { pageSize: 200 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);

		await expect(messageRow(canvasElement, fakeMessageId(10))).not.toBeNull();
		await expect(messageRow(canvasElement, fakeMessageId(11))).toBeNull();
		await expect(messageRow(canvasElement, fakeMessageId(100))).toBeNull();
	},
};

/** R66: the arrows reach a message next to the focused one that the virtualizer has not rendered, and the list does not snap back to the bottom. */
export const KeyboardIntoUnrenderedRows: Story = {
	args: { history: { size: 200, liveEmbedAt: [100] }, source: { pageSize: 200 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		await expect(messageRow(canvasElement, fakeMessageId(99))).toBeNull();
		const kept = messageRow(canvasElement, fakeMessageId(100))?.querySelector<HTMLElement>('.rcx-message');
		kept?.focus({ preventScroll: true });
		await expect(document.activeElement).toBe(kept);

		await userEvent.keyboard('{ArrowUp}');
		await waitFor(() => document.activeElement?.closest<HTMLElement>('[data-message-id]')?.dataset.messageId === fakeMessageId(99));

		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		await waitFor(() => document.activeElement?.closest<HTMLElement>('[data-message-id]')?.dataset.messageId === fakeMessageId(101));
		await waitForListSettled(canvasElement);
		await expect(viewport.closest('[data-anchor]')).toHaveAttribute('data-anchor', 'none');
	},
};

/** R66: from a kept-mounted row far from the viewport, an arrow reaches the row next to it, not the nearest rendered one in either direction. */
export const KeyboardFromAKeptMountedRow: Story = {
	args: { history: { size: 200, liveEmbedAt: [100] }, source: { pageSize: 200 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const focusKept = () => {
			const kept = messageRow(canvasElement, fakeMessageId(100))?.querySelector<HTMLElement>('.rcx-message');
			kept?.focus({ preventScroll: true });
			return kept;
		};
		const focusedId = () => document.activeElement?.closest<HTMLElement>('[data-message-id]')?.dataset.messageId;
		await expect(messageRow(canvasElement, fakeMessageId(101))).toBeNull();
		await expect(document.activeElement).not.toBe(null);
		await expect(focusKept()).toBe(document.activeElement);

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => focusedId() === fakeMessageId(101));
		await waitForListSettled(canvasElement);
		await expect(focusedId()).toBe(fakeMessageId(101));

		// With the render window above the kept row, the nearest rendered row before it is far away
		await userScrollTo(canvasElement, 0);
		await expect(messageRow(canvasElement, fakeMessageId(99))).toBeNull();
		await expect(focusKept()).toBe(document.activeElement);

		await userEvent.keyboard('{ArrowUp}');
		await waitFor(() => focusedId() === fakeMessageId(99));
		await waitForListSettled(canvasElement);
		await expect(focusedId()).toBe(fakeMessageId(99));
	},
};

/** R54, R55: the list reports what is visible as soon as it is placed, and again when the viewer moves. */
export const ReportsWhatIsVisible: Story = {
	args: { history: { size: 80 }, source: { pageSize: 80, firstUnreadMessageId: fakeMessageId(30) } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await waitFor(() => readVisibility(canvasElement).top !== undefined);
		await expect(readVisibility(canvasElement)).toMatchObject({ isFirstUnreadVisible: false, isAtBottom: true });
		await expect(Number(readVisibility(canvasElement).top?.slice(-5))).toBeGreaterThan(55);

		await userScrollTo(canvasElement, 0);
		await waitFor(() => readVisibility(canvasElement).top === fakeMessageId(0));
		await expect(readVisibility(canvasElement).isAtBottom).toBe(false);

		await userEvent.click(canvas.getByRole('button', { name: 'Jump to first unread' }));
		await waitForListSettled(canvasElement);
		await waitFor(() => readVisibility(canvasElement).isFirstUnreadVisible === true);
	},
};

/**
 * R51, R52: the floating date stands in for the day divider under it, which hides, and stays while that divider is just above
 * the list; the next day's divider pushes it up and shows again; away from any divider it fades a second after the last scroll.
 */
export const FloatingDateNeverDoublesADay: Story = {
	args: { history: { size: 120 }, source: { pageSize: 120 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const bubble = () => canvasElement.querySelector<HTMLElement>('[aria-hidden="true"][data-visible]') as HTMLElement;
		for (let step = 0; step < 30 && !viewport.querySelector('[data-day-divider]'); step++) {
			await userScrollBy(canvasElement, -400);
		}
		const divider = Array.from(viewport.querySelectorAll<HTMLElement>('[data-day-divider]')).at(-1) as HTMLElement;
		const dividerTop = () => divider.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
		const { height } = divider.getBoundingClientRect();

		await userScrollBy(canvasElement, dividerTop() + 10);
		await waitFor(() => divider.getAttribute('data-covered') === 'true');
		await expect(bubble()).toHaveAttribute('data-visible', 'true');
		await expect(bubble()).toHaveTextContent(divider.textContent);
		await new Promise((resolve) => setTimeout(resolve, 1300));
		await expect(bubble()).toHaveAttribute('data-visible', 'true');

		await userScrollBy(canvasElement, dividerTop() - 10);
		await waitFor(() => divider.getAttribute('data-covered') === null);
		await expect(bubble()).toHaveAttribute('data-visible', 'true');
		await expect(Math.abs(parseFloat(bubble().style.getPropertyValue('--date-bubble-offset')) - (10 - height))).toBeLessThanOrEqual(1);
		await expect(bubble()).not.toHaveTextContent(divider.textContent);

		await userScrollBy(canvasElement, dividerTop() - 200);
		await waitFor(() => bubble().getAttribute('data-visible') === 'false', 3000);
		await expect(divider).not.toHaveAttribute('data-covered');
	},
};

/**
 * R85, R51, R52: with an inset for what the consumer draws over the top of the list, the floating date rests below it and stands in
 * for the divider under itself, not for the one at the top of the viewport.
 */
export const FloatingDateBelowAnInset: Story = {
	args: { history: { size: 120 }, source: { pageSize: 120 }, list: { overlayTopInset: 60 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const bubble = () => canvasElement.querySelector<HTMLElement>('[aria-hidden="true"][data-visible]') as HTMLElement;
		for (let step = 0; step < 30 && !viewport.querySelector('[data-day-divider]'); step++) {
			await userScrollBy(canvasElement, -400);
		}
		const divider = Array.from(viewport.querySelectorAll<HTMLElement>('[data-day-divider]')).at(-1) as HTMLElement;
		const dividerTop = () => divider.getBoundingClientRect().top - viewport.getBoundingClientRect().top;

		// Under the inset, below the top of the viewport
		await userScrollBy(canvasElement, dividerTop() - 50);
		await waitFor(() => divider.getAttribute('data-covered') === 'true');
		await expect(bubble()).toHaveAttribute('data-visible', 'true');
		await expect(bubble()).toHaveTextContent(divider.textContent);
		await expect(Math.abs(bubble().getBoundingClientRect().top - viewport.getBoundingClientRect().top - (60 + 8))).toBeLessThanOrEqual(1);
	},
};

/**
 * R85: when what the consumer draws over the list goes without a scroll, the floating date is placed again for the new line: the
 * divider it stood in for shows again and the date fades.
 */
export const FloatingDateFollowsTheInset: Story = {
	args: { history: { size: 120 }, source: { pageSize: 120 }, list: { overlayTopInset: 60 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const bubble = () => canvasElement.querySelector<HTMLElement>('[aria-hidden="true"][data-visible]') as HTMLElement;
		for (let step = 0; step < 30 && !viewport.querySelector('[data-day-divider]'); step++) {
			await userScrollBy(canvasElement, -400);
		}
		const divider = Array.from(viewport.querySelectorAll<HTMLElement>('[data-day-divider]')).at(-1) as HTMLElement;
		const dividerTop = () => divider.getBoundingClientRect().top - viewport.getBoundingClientRect().top;

		// Under the inset, below the top of the viewport: the date holds for it
		await userScrollBy(canvasElement, dividerTop() - 50);
		await waitFor(() => divider.getAttribute('data-covered') === 'true');

		await userEvent.click(within(canvasElement).getByRole('button', { name: 'Toggle top inset' }));
		await waitFor(() => divider.getAttribute('data-covered') === null);
		await expect(bubble()).not.toHaveTextContent(divider.textContent);
		await waitFor(() => bubble().getAttribute('data-visible') === 'false', 3000);
	},
};

/** R56: being at the bottom is the position, so it is reported right after a jump to the last message, and not on an older window. */
export const ReportsBeingAtTheBottomAfterAJump: Story = {
	args: { history: { size: 80 }, source: { pageSize: 80 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollTo(canvasElement, 0);
		await waitFor(() => readVisibility(canvasElement).isAtBottom === false);

		await userEvent.click(canvas.getByRole('button', { name: 'Jump to the last message' }));
		await waitFor(() => readVisibility(canvasElement).isAtBottom === true, 1500);
	},
};

/** R56: at the end of an older window the viewer is not at the bottom of the conversation, and the report says so once it reflects the new position. */
export const ReportsNotBeingAtTheBottomOfAnOlderWindow: Story = {
	args: {
		history: { size: 300 },
		source: { pageSize: 30, latency: 'manual', initialWindow: { around: fakeMessageId(100) } },
		initialTargetIndex: 100,
	},
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const before = readVisibility(canvasElement).top;

		viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 10_000, bubbles: true }));
		viewport.scrollTop = viewport.scrollHeight;
		await waitFor(() => distanceFromBottom(viewport) <= 1);
		await waitFor(() => readVisibility(canvasElement).top !== before);
		await expect(readVisibility(canvasElement).isAtBottom).toBe(false);
	},
};

/** R55: a viewport that changes size changes what is visible, and the list reports it though nothing scrolled. */
export const ReportsAfterAResize: Story = {
	args: { history: { size: 80 }, source: { pageSize: 80, firstUnreadMessageId: fakeMessageId(50) } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Jump to first unread' }));
		await waitForListSettled(canvasElement);

		const viewportBottom = getViewport(canvasElement).getBoundingClientRect().bottom;
		const unreadTop = (messageRow(canvasElement, fakeMessageId(50)) as HTMLElement).getBoundingClientRect().top;
		await userScrollBy(canvasElement, unreadTop - (viewportBottom - 60));
		await waitFor(() => readVisibility(canvasElement).isFirstUnreadVisible === true);

		await userEvent.click(canvas.getByRole('button', { name: 'Toggle container height' }));
		await waitFor(() => readVisibility(canvasElement).isFirstUnreadVisible === false, 1500);
	},
};

/** R80: with a threshold, a viewer a little above the bottom still follows resizes and arrivals, all the way to the bottom, and one beyond it reads away. */
export const BottomThreshold: Story = {
	args: { history: { size: 60 }, source: { pageSize: 60 }, list: { bottomThreshold: 60 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const viewport = getViewport(canvasElement);
		await waitForListSettled(canvasElement);

		// The composer shrinks the viewport by 30px: a gap of 10 becomes 40, clearly inside the threshold of 60 and clearly more than a pixel
		await userScrollBy(canvasElement, -10);
		await expect(viewport.closest('[data-anchor]')).toHaveAttribute('data-anchor', 'bottom');
		await userEvent.click(canvas.getByRole('button', { name: 'Nudge composer' }));
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);

		await userScrollBy(canvasElement, -40);
		await expect(viewport.closest('[data-anchor]')).toHaveAttribute('data-anchor', 'bottom');

		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitFor(() => messageRow(canvasElement, fakeMessageId(60)) !== null);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(canvas.getByText('New messages').closest('[data-visible]')).toHaveAttribute('data-visible', 'false');

		await userScrollBy(canvasElement, -300);
		await expect(viewport.closest('[data-anchor]')).toHaveAttribute('data-anchor', 'none');
		const reading = firstVisibleMessage(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitForListSettled(canvasElement);
		await expect(firstVisibleMessage(canvasElement)).toEqual(reading);
		await expect(canvas.getByText('New messages').closest('[data-visible]')).toHaveAttribute('data-visible', 'true');
	},
};

/** R82: with `deferPagingUntilInput`, a scroll the list does not get from the viewer loads nothing; the viewer reaching the top loads one page. */
export const PagingWaitsForInput: Story = {
	args: { history: { size: 200 }, source: { pageSize: 30, latency: 100 }, list: { deferPagingUntilInput: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const viewport = getViewport(canvasElement);
		await waitForListSettled(canvasElement);

		// A scroll with no input behind it, which the list then takes back to the bottom it holds
		viewport.scrollTop = 0;
		await waitForListSettled(canvasElement);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('0');

		await userScrollTo(canvasElement, 0);
		await waitFor(() => canvas.getByLabelText('Loads').textContent === '1');
		await waitFor(() => viewport.getAttribute('aria-busy') === 'false');
		await waitForListSettled(canvasElement);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('1');
	},
};

/** R82, R34: with `deferPagingUntilInput`, a first page shorter than the viewport waits for the viewer, then fills the viewport. */
export const PagingWaitsForInputOnAShortPage: Story = {
	args: { history: { size: 300 }, source: { pageSize: 4, latency: 50 }, list: { deferPagingUntilInput: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const viewport = getViewport(canvasElement);
		await waitForListSettled(canvasElement);
		await expect(canvas.getByLabelText('Loads')).toHaveTextContent('0');

		viewport.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		await waitFor(() => Number(canvas.getByLabelText('Loads').textContent) >= 2);
		await waitFor(() => viewport.getAttribute('aria-busy') === 'false');
		await waitForListSettled(canvasElement);
		const first = viewport.querySelector<HTMLElement>('[data-message-id]') as HTMLElement;
		await expect(first.getBoundingClientRect().top).toBeLessThanOrEqual(viewport.getBoundingClientRect().top + 1);
	},
};

/** R4, R83: the spinner of the first page sits where the older loader would, below the space above the first row. */
export const FirstPageLoadingBelowTheSpace: Story = {
	args: { history: { size: 0 }, source: { latency: 'manual', isInitiallyLoading: true }, list: { startSpacing: 21 } },
	play: async ({ canvasElement }) => {
		const viewportTop = getViewport(canvasElement).getBoundingClientRect().top;
		const spinner = (canvasElement.querySelector('.rcx-throbber') as HTMLElement).getBoundingClientRect();
		await expect(spinner.top - viewportTop).toBeGreaterThanOrEqual(21);
		await expect(spinner.bottom - viewportTop).toBeLessThanOrEqual(21 + 32);
	},
};

/**
 * R83: space above the first row and below the last one is part of the list: it rests at the bottom with the space in view,
 * keeps it as messages arrive and the viewport resizes, and opens the space above the header once at the top.
 */
export const SpaceAtTheEnds: Story = {
	args: { history: { size: 60 }, source: { pageSize: 30, latency: 100 }, list: { startSpacing: 21, endSpacing: 10 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const viewport = getViewport(canvasElement);
		const lastMessage = () => Array.from(viewport.querySelectorAll<HTMLElement>('[data-message-id]')).at(-1) as HTMLElement;
		const spaceBelow = () => viewport.getBoundingClientRect().bottom - lastMessage().getBoundingClientRect().bottom;
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(Math.abs(spaceBelow() - 10)).toBeLessThanOrEqual(1);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitFor(() => messageRow(canvasElement, fakeMessageId(60)) !== null);
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(Math.abs(spaceBelow() - 10)).toBeLessThanOrEqual(1);

		await userEvent.click(canvas.getByRole('button', { name: 'Toggle composer height' }));
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(Math.abs(spaceBelow() - 10)).toBeLessThanOrEqual(1);

		await userScrollTo(canvasElement, 0);
		const reading = firstVisibleMessage(canvasElement);
		await waitFor(() => messageRow(canvasElement, fakeMessageId(29)) !== null);
		await waitForListSettled(canvasElement);
		await expect(Math.abs(messageOffset(canvasElement, reading.id) - reading.top)).toBeLessThanOrEqual(1);

		await userScrollTo(canvasElement, 0);
		await waitFor(() => canvasElement.querySelector('[data-qa="start-of-conversation"]') !== null);
		const header = viewport.querySelector('[data-row-index="0"]') as HTMLElement;
		await expect(Math.abs(header.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 21)).toBeLessThanOrEqual(1);
	},
};

/**
 * R84: a list is seen only where it opens, in every frame from the first one shown: at the bottom for a conversation opened
 * anew, on the message it was left at for one opened again, even when the height of its rows settles a few frames after they
 * mount.
 */
export const OpensWhereItLands: Story = {
	render: () => <TwoRoomsPlayground hasSettlingContent />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollBy(canvasElement, -900);
		const left = firstVisibleMessage(canvasElement);

		const stopOpeningB = recordShownFrames(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Room B' }));
		await waitForListSettled(canvasElement);
		const framesOfB = stopOpeningB();
		await expect(framesOfB.length).toBeGreaterThan(0);
		await expect(Math.max(...framesOfB.map((frame) => frame.distanceFromBottom))).toBeLessThanOrEqual(1);

		const stopOpeningA = recordShownFrames(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Room A' }));
		await waitForListSettled(canvasElement);
		const framesOfA = stopOpeningA();
		await expect(framesOfA.length).toBeGreaterThan(0);
		await expect(framesOfA.filter((frame) => frame.firstMessage.id !== left.id || Math.abs(frame.firstMessage.top - left.top) > 1)).toEqual(
			[],
		);
	},
};

/**
 * R84, R29: a list the viewer already saw is never hidden again: an empty conversation showing its header stays in sight, header
 * and content, in every frame from before its first message arrives until after the list settles on it.
 */
export const FirstMessageStaysInSight: Story = {
	args: { history: { size: 0 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		await expect(canvasElement.querySelector('[data-qa="start-of-conversation"]')).not.toBeNull();

		const frames: { isHeaderInSight: boolean; contentOpacity: string }[] = [];
		let isRecording = true;
		const record = () => {
			const header = canvasElement.querySelector<HTMLElement>('[data-qa="start-of-conversation"]');
			const content = viewport.firstElementChild as HTMLElement;
			frames.push({
				isHeaderInSight: !!header?.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
				contentOpacity: getComputedStyle(content).opacity,
			});
		};
		const onFrame = () => {
			if (!isRecording) {
				return;
			}
			record();
			setTimeout(record);
			requestAnimationFrame(onFrame);
		};
		requestAnimationFrame(onFrame);

		await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
		await waitFor(() => messageRow(canvasElement, fakeMessageId(0)) !== null);
		await waitForListSettled(canvasElement);
		isRecording = false;

		await expect(frames.length).toBeGreaterThan(10);
		await expect(frames.filter((frame) => !frame.isHeaderInSight || frame.contentOpacity !== '1')).toEqual([]);
	},
};
