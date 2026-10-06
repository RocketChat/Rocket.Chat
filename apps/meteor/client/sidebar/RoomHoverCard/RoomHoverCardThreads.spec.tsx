import type { IThreadMainMessage, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import RoomHoverCardThreads from './RoomHoverCardThreads';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';

// The thread view's own message rendering is covered by its specs; here it only has to show which message is where.
jest.mock('../../views/room/contextualBar/Threads/components/ThreadMessageItem', () => ({
	ThreadMessageItem: ({ message, firstUnread }: { message: { msg: string }; firstUnread: boolean }) => (
		<div>
			{firstUnread && <span>unread messages</span>}
			<p>{message.msg}</p>
		</div>
	),
}));

jest.mock('../../views/room/MessageList/providers/MessageListProvider', () => ({ children }: { children: ReactNode }) => <>{children}</>);

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const thread = (_id: string, msg: string, lastReplyMinutesAgo: number) =>
	JSON.parse(
		JSON.stringify(createFakeMessage({ _id, rid: 'room', msg, tcount: 3, tlm: minutesAgo(lastReplyMinutesAgo) })),
	) as Serialized<IThreadMainMessage>;

const threads = [
	thread('t1', 'Release checklist', 5),
	thread('t2', 'Flaky e2e on CI', 10),
	thread('t3', 'Who reviews the API change?', 50),
	thread('t4', 'Retro notes', 20),
	thread('t5', 'Office move', 30),
	thread('t6', 'Lunch?', 40),
];

const room = createFakeRoom({ _id: 'room', t: 'c', name: 'general', fname: 'general' });

const subscription = createFakeSubscription({
	rid: 'room',
	tunread: threads.map(({ _id }) => _id),
	tunreadUser: ['t3'],
	tunreadGroup: [],
});

const replies = [
	createFakeMessage({ _id: 'r1', rid: 'room', tmid: 't3', msg: 'I can take it after lunch', ts: minutesAgo(48) }),
	createFakeMessage({ _id: 'r2', rid: 'room', tmid: 't3', msg: 'Pinging the API owners', ts: minutesAgo(45) }),
];

const renderThreads = () => {
	const onOpenThread = jest.fn();
	const onOpenThreads = jest.fn();
	const readThread = jest.fn();
	const getThreadMessages = jest.fn(() => ({
		messages: JSON.parse(JSON.stringify([...replies].reverse())),
		count: 2,
		offset: 0,
		total: 2,
	}));

	render(
		<RoomHoverCardThreads
			room={room}
			subscription={subscription}
			roomName='general'
			onOpenThread={onOpenThread}
			onOpenThreads={onOpenThreads}
		/>,
		{
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Unread_threads_count_other: '{{count}} unread threads',
					More_unread_threads_other: '+{{count}} more threads',
					View_all_threads: 'View all threads',
					Thread: 'Thread',
					Reply_in_thread: 'Reply in thread',
				})
				.withEndpoint('GET', '/v1/chat.getThreadsList', () => ({ threads, total: threads.length, count: threads.length, offset: 0 }))
				.withEndpoint('GET', '/v1/chat.getThreadMessages', getThreadMessages)
				.withEndpoint('POST', '/v1/chat.readThread', readThread)
				.build(),
		},
	);

	return { onOpenThread, onOpenThreads, getThreadMessages, readThread };
};

it('lists up to four unread threads, mentions first then by last reply, and counts the rest', async () => {
	renderThreads();

	expect(await screen.findByText('Who reviews the API change?')).toBeInTheDocument();

	const rows = screen.getAllByRole('listitem').map((row) => row.textContent);
	expect(rows).toEqual([
		expect.stringContaining('Who reviews the API change?'),
		expect.stringContaining('Release checklist'),
		expect.stringContaining('Flaky e2e on CI'),
		expect.stringContaining('Retro notes'),
	]);
	expect(screen.getByText('+2 more threads')).toBeInTheDocument();
	expect(screen.getByText('6 unread threads')).toBeInTheDocument();
});

it('opens the thread a row stands for, and the thread list from "View all threads"', async () => {
	const { onOpenThread, onOpenThreads } = renderThreads();

	await userEvent.click(await screen.findByText('Release checklist'));
	expect(onOpenThread).toHaveBeenCalledWith('t1');

	await userEvent.click(screen.getByRole('button', { name: /View all threads/ }));
	expect(onOpenThreads).toHaveBeenCalled();
});

it('previews a thread when the pointer rests on its row, without marking it read', async () => {
	const { getThreadMessages, readThread } = renderThreads();

	await userEvent.hover(await screen.findByText('Who reviews the API change?'));

	expect(await screen.findByRole('dialog', { name: 'Thread' })).toBeInTheDocument();
	expect(await screen.findByText('Pinging the API owners')).toBeInTheDocument();
	expect(screen.getByText('unread messages')).toBeInTheDocument();
	expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ tmid: 't3' }));
	expect(readThread).not.toHaveBeenCalled();
});
