import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import MessageListPlayground from './stories/MessageListPlayground';
import TwoRoomsPlayground from './stories/TwoRoomsPlayground';
import {
	distanceFromBottom,
	expectAtBottom,
	firstVisibleMessage,
	getViewport,
	messageOffset,
	messageRow,
	offsetFromCenter,
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
		await new Promise((resolve) => setTimeout(resolve, 150));
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

/** B1: a conversation opens at its newest message. */
export const Default: Story = {
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await expectAtBottom(canvasElement);
		await expect(messageRow(canvasElement, fakeMessageId(59))).toBeInTheDocument();
		await expect(canvasElement.querySelector('.os-scrollbar')).not.toBeNull();
	},
};

/** A list shorter than its viewport sits at the bottom, next to the composer. */
export const ShortList: Story = {
	args: { history: { size: 3 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const last = messageRow(canvasElement, fakeMessageId(2));
		await expect(Math.abs(viewport.getBoundingClientRect().bottom - (last?.getBoundingClientRect().bottom ?? 0))).toBeLessThanOrEqual(1);
	},
};

export const Empty: Story = {
	args: { history: { size: 0 }, hasHeader: false },
	play: async ({ canvasElement }) => {
		await expect(within(canvasElement).getByRole('list', { name: 'Message list' })).toBeInTheDocument();
	},
};

/** B5, B21: reaching the top loads older messages without moving what is on screen. */
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

/** B2: new messages keep a list at the bottom at the bottom. */
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

/** B4: a message arriving while scrolled up shows "New messages", which takes the viewer down. */
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

/** B3: the viewer's own message takes them to it, even from an older window of the conversation. */
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

/** B7: jumping to a loaded message centers and highlights it. */
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

/** B7: jumping to a message that is not loaded waits for the messages around it, then jumps. */
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

/** B7: the target stays centered while content around it resolves its height late. */
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

/** B8, B9: the unread divider marks the first unread message, and the list can jump to it. */
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

/** B6: from an older window, reaching the bottom loads newer messages, and "Jump to recent messages" resets to the latest. */
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

/** B6, B21: newer messages load at the bottom of an older window. */
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

/** B2: content that grows after it is shown keeps a list at the bottom at the bottom. */
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

/** B2: a growing composer and a shrinking container keep a list at the bottom at the bottom. */
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

/** B14: switching conversations brings each one back where it was left. */
export const RestorePosition: Story = {
	render: () => <TwoRoomsPlayground />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitForListSettled(canvasElement);
		await userScrollBy(canvasElement, -900);
		const left = firstVisibleMessage(canvasElement);
		await new Promise((resolve) => setTimeout(resolve, 300));

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
		await new Promise((resolve) => setTimeout(resolve, 300));

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

/** B12: the header shows once no older messages remain. */
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

/** A thread: replies grouped by author, the main message first, only the floating date over the list. */
export const ThreadLayout: Story = {
	args: { isThread: true, hasHeader: false, history: { size: 25 } },
};

/** B13: loading the first page, then older pages: the spinner shows only while a page is on its way. */
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

/** B7: the target of a jump is highlighted for a while. */
export const HighlightedMessage: Story = {
	args: { history: { size: 40 }, source: { pageSize: 40 }, initialTargetIndex: 20 },
	play: async ({ canvasElement }) => {
		await waitFor(() => messageRow(canvasElement, fakeMessageId(20))?.querySelector('.rcx-message--editing') !== null);
	},
};

/** B10: the floating date shows the day of the top message while the viewer scrolls. */
export const FloatingDate: Story = {
	args: { history: { size: 120 }, source: { pageSize: 120 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -300, bubbles: true }));
		viewport.scrollTop -= 300;
		await waitFor(() => canvasElement.querySelector('[data-visible="true"][aria-hidden="true"]') !== null);
	},
};

/** R25: only the viewer's input releases the bottom: a scroll the browser makes does not, a key in a text field does not, a scroll key does. */
export const UserInputReleasesTheBottom: Story = {
	args: { history: { size: 30 }, source: { pageSize: 30 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const host = viewport.closest<HTMLElement>('[data-anchor]') as HTMLElement;
		const field = document.createElement('input');
		viewport.appendChild(field);

		field.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
		viewport.scrollTop = 0;
		await waitFor(() => viewport.scrollTop === 0);
		await new Promise((resolve) => setTimeout(resolve, 400));
		await expect(host).toHaveAttribute('data-anchor', 'bottom');

		viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
		viewport.scrollTop = viewport.scrollHeight;
		await waitFor(() => host.dataset.anchor === 'bottom');
		viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
		viewport.scrollTop = 0;
		await waitFor(() => host.dataset.anchor === 'none');

		await userScrollTo(canvasElement, viewport.scrollHeight);
		await expect(host).toHaveAttribute('data-anchor', 'bottom');
		host.querySelector('.os-scrollbar')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		viewport.scrollTop = 0;
		await waitFor(() => host.dataset.anchor === 'none');
		field.remove();
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
		await new Promise((resolve) => setTimeout(resolve, 500));
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

/** R66: the arrows move through messages the virtualizer has not rendered, and the list does not snap back to the bottom. */
export const KeyboardIntoUnrenderedRows: Story = {
	args: { history: { size: 200 }, source: { pageSize: 200 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const last = messageRow(canvasElement, fakeMessageId(199))?.querySelector<HTMLElement>('.rcx-message');
		last?.focus();

		for (let step = 1; step <= 25; step++) {
			await userEvent.keyboard('{ArrowUp}');
			await waitFor(
				() => document.activeElement?.closest<HTMLElement>('[data-message-id]')?.dataset.messageId === fakeMessageId(199 - step),
			);
		}

		await waitForListSettled(canvasElement);
		await expect(viewport.closest('[data-anchor]')).toHaveAttribute('data-anchor', 'none');
		await expect(document.activeElement?.closest('[data-message-id]')).toHaveAttribute('data-message-id', fakeMessageId(174));
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

/** R52: a day shows once: the floating date hides while the day's divider is at the top, and shows below it. */
export const FloatingDateNeverDoublesADay: Story = {
	args: { history: { size: 120 }, source: { pageSize: 120 } },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		const bubble = () => canvasElement.querySelector<HTMLElement>('[aria-hidden="true"][data-visible]') as HTMLElement;
		for (let step = 0; step < 30 && !viewport.querySelector('.rcx-message-divider'); step++) {
			await userScrollBy(canvasElement, -400);
		}
		const divider = Array.from(viewport.querySelectorAll<HTMLElement>('.rcx-message-divider')).at(-1) as HTMLElement;
		const dividerTop = divider.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;

		viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
		viewport.scrollTop = dividerTop;
		await waitFor(() => Math.abs(viewport.scrollTop - dividerTop) <= 1);
		await new Promise((resolve) => setTimeout(resolve, 100));
		await expect(bubble()).toHaveAttribute('data-visible', 'false');

		viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true }));
		viewport.scrollTop = dividerTop + 150;
		await waitFor(() => bubble().getAttribute('data-visible') === 'true');
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

export const ReportsNotBeingAtTheBottomOfAnOlderWindow: Story = {
	args: {
		history: { size: 300 },
		source: { pageSize: 30, latency: 100, initialWindow: { around: fakeMessageId(100) } },
		initialTargetIndex: 100,
	},
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const viewport = getViewport(canvasElement);
		viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 10_000, bubbles: true }));
		viewport.scrollTop = viewport.scrollHeight;
		await waitFor(() => distanceFromBottom(viewport) <= 1);
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

/** R80: with a threshold, a viewer a little above the bottom still follows arrivals, and one beyond it reads away. */
export const BottomThreshold: Story = {
	args: { history: { size: 60 }, source: { pageSize: 60 }, list: { bottomThreshold: 60 } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const viewport = getViewport(canvasElement);
		await waitForListSettled(canvasElement);

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
