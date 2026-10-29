import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import type { MessageListHandle, MessageListProps } from './MessageList';
import MessageList from './MessageList';
import * as stories from './MessageList.stories';
import MessageListJumpToLatestButton from './MessageListJumpToLatestButton';
import MessageListNewMessagesButton from './MessageListNewMessagesButton';
import PlaceholderMessage from './stories/PlaceholderMessage';
import { expectListKeyboard } from '../../../tests/utils/listContract';

jest.mock('./MessageListVirtualizer', () => jest.requireActual('./MessageListRows'));

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Unread_Messages: 'Unread messages',
		New_messages: 'New messages',
		Jump_to_recent_messages: 'Jump to recent messages',
	})
	.build();

const day = (date: number, hours = 10) => new Date(2024, 0, date, hours);

const messages = [
	createFakeMessage({ _id: 'a', msg: 'first', ts: day(14), u: { _id: 'alice', username: 'alice', name: 'Alice' } }),
	createFakeMessage({ _id: 'b', msg: 'second', ts: day(15), u: { _id: 'alice', username: 'alice', name: 'Alice' } }),
	createFakeMessage({ _id: 'c', msg: 'third', ts: day(15, 11), u: { _id: 'bob', username: 'bob', name: 'Bob' } }),
];

const renderList = (props: Partial<MessageListProps<IMessage>> = {}) =>
	render(
		<MessageList<IMessage>
			aria-label='Message list'
			messages={messages}
			renderMessage={(row) => <PlaceholderMessage message={row.message} isSequential={row.isSequential} />}
			{...props}
		/>,
		{ wrapper },
	);

describe('MessageList', () => {
	it('should render a labelled list of messages', () => {
		renderList();

		const list = screen.getByRole('list', { name: 'Message list' });
		expect(within(list).getAllByRole('listitem', { description: undefined }).length).toBeGreaterThanOrEqual(3);
		expect(within(list).getByText('first')).toBeInTheDocument();
		expect(within(list).getByText('third')).toBeInTheDocument();
	});

	it('should name each message after its author', () => {
		renderList();

		expect(screen.getAllByRole('listitem', { name: 'Alice' })).toHaveLength(2);
		expect(screen.getByRole('listitem', { name: 'Bob' })).toHaveAttribute('aria-roledescription', 'message');
	});

	it('should draw a day divider before the first message of each day', () => {
		renderList();

		const dividers = document.querySelectorAll('.rcx-message-divider');
		expect(dividers).toHaveLength(2);
	});

	it('should combine the unread divider with the day divider on the same message', () => {
		renderList({ firstUnreadMessageId: 'b' });

		expect(document.querySelectorAll('.rcx-message-divider')).toHaveLength(2);
		expect(screen.getByText('unread messages')).toBeInTheDocument();
	});

	it('should show the header once no older messages remain', () => {
		const { rerender } = renderList({ header: <p>Start of conversation</p>, hasOlderMessages: true });
		expect(screen.queryByText('Start of conversation')).not.toBeInTheDocument();

		rerender(
			<MessageList<IMessage>
				aria-label='Message list'
				messages={messages}
				header={<p>Start of conversation</p>}
				renderMessage={(row) => <PlaceholderMessage message={row.message} isSequential={row.isSequential} />}
			/>,
		);
		expect(screen.getByText('Start of conversation')).toBeInTheDocument();
	});

	it('should be busy while loading, with a loader for the page on its way', () => {
		renderList({ hasOlderMessages: true, isLoadingOlderMessages: true });

		expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
		expect(document.querySelector('.rcx-throbber')).toBeInTheDocument();
	});

	it('should show a loader instead of rows while the first page loads', () => {
		renderList({ messages: [], isLoadingInitialMessages: true, header: <p>Start of conversation</p> });

		expect(screen.queryByText('Start of conversation')).not.toBeInTheDocument();
		expect(document.querySelector('.rcx-throbber')).toBeInTheDocument();
	});

	it('should render each message through `renderMessage`, with its grouping', () => {
		const renderMessage = jest.fn(() => null);
		const grouped = [...messages, createFakeMessage({ _id: 'd', ts: day(15, 11), u: messages[2].u })];

		renderList({ messages: grouped, renderMessage });

		expect(renderMessage).toHaveBeenCalledWith(expect.objectContaining({ key: 'c', isSequential: false, startsNewDay: false }));
		expect(renderMessage).toHaveBeenCalledWith(expect.objectContaining({ key: 'd', isSequential: true }));
	});

	it('should show "Jump to recent messages" only while newer messages remain', () => {
		renderList({ hasNewerMessages: true, children: <MessageListJumpToLatestButton /> });

		expect(screen.getByText('Jump to recent messages').closest('[data-visible]')).toHaveAttribute('data-visible', 'true');
		expect(screen.getByText('Jump to recent messages').closest('[data-visible]')).toHaveAttribute('aria-hidden', 'false');
	});

	it('should hide "New messages" until a message arrives out of view', () => {
		renderList({ children: <MessageListNewMessagesButton /> });

		expect(screen.getByText('New messages').closest('[data-visible]')).toHaveAttribute('data-visible', 'false');
	});

	it('should ask for the latest page when told to scroll to the bottom of an older window', () => {
		const onJumpToLatest = jest.fn();
		const ref = createRef<MessageListHandle>();
		renderList({ ref, hasNewerMessages: true, onJumpToLatest });

		act(() => ref.current?.scrollToBottom());

		expect(onJumpToLatest).toHaveBeenCalledTimes(1);
	});

	it('should report a loaded jump target as reached', () => {
		const onTargetMessageReached = jest.fn();
		renderList({ targetMessageId: 'b', onTargetMessageReached });

		expect(onTargetMessageReached).toHaveBeenCalledWith('b');
	});

	it('should follow the keyboard model of a list of rows', async () => {
		render(
			<>
				<button type='button'>before</button>
				<MessageList<IMessage>
					aria-label='Message list'
					messages={messages}
					renderMessage={(row) => <PlaceholderMessage message={row.message} isSequential={row.isSequential} />}
				/>
				<button type='button'>after</button>
			</>,
			{ wrapper },
		);

		await expectListKeyboard(screen.getByRole('list'), screen.getAllByRole('listitem', { name: /Alice|Bob/ })[0]);
	});
});

describe('MessageList stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
