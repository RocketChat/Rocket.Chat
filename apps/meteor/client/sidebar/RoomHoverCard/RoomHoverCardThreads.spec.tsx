import type { IThreadMainMessage, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomHoverCardThreads from './RoomHoverCardThreads';
import { createFakeMessage, createFakeSubscription } from '../../../tests/mocks/data';

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

const subscription = createFakeSubscription({
	rid: 'room',
	tunread: threads.map(({ _id }) => _id),
	tunreadUser: ['t3'],
	tunreadGroup: [],
});

const renderThreads = () => {
	const onOpenThread = jest.fn();
	const onOpenThreads = jest.fn();

	render(<RoomHoverCardThreads subscription={subscription} onOpenThread={onOpenThread} onOpenThreads={onOpenThreads} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Unread_threads_count_other: '{{count}} unread threads',
				More_unread_threads_one: '{{count}} more unread thread',
				More_unread_threads_other: '{{count}} more unread threads',
			})
			.withEndpoint('GET', '/v1/chat.getThreadsList', () => ({ threads, total: threads.length, count: threads.length, offset: 0 }))
			.build(),
	});

	return { onOpenThread, onOpenThreads };
};

it('lists up to four unread threads, mentions first then by last reply, and counts the rest', async () => {
	renderThreads();

	expect(await screen.findByText('Who reviews the API change?')).toBeInTheDocument();

	const rows = screen.getAllByRole('button').map((button) => button.textContent);
	expect(rows).toEqual([
		expect.stringContaining('Who reviews the API change?'),
		expect.stringContaining('Release checklist'),
		expect.stringContaining('Flaky e2e on CI'),
		expect.stringContaining('Retro notes'),
		expect.stringContaining('2 more unread threads'),
	]);
	expect(screen.getByText('6 unread threads')).toBeInTheDocument();
});

it('opens the thread a row stands for, and the thread list from the last row', async () => {
	const { onOpenThread, onOpenThreads } = renderThreads();

	await userEvent.click(await screen.findByText('Release checklist'));
	expect(onOpenThread).toHaveBeenCalledWith('t1');

	await userEvent.click(screen.getByText('2 more unread threads'));
	expect(onOpenThreads).toHaveBeenCalled();
});
