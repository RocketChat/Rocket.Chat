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
	messageRow,
	offsetFromCenter,
	userScrollBy,
	userScrollTo,
	waitFor,
	waitForListSettled,
} from './stories/playHelpers';
import { fakeMessageId } from './stories/useFakeMessageSource';

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

/** B13: loading the first page, then older pages. */
export const LoadingStates: Story = {
	args: { history: { size: 200 }, source: { pageSize: 20, latency: 'manual', isInitiallyLoading: true } },
	play: async ({ canvasElement }) => {
		const viewport = getViewport(canvasElement);
		await expect(viewport).toHaveAttribute('aria-busy', 'true');
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
