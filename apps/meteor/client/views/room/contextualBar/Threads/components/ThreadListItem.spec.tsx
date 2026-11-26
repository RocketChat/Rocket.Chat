import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ThreadListItem from './ThreadListItem';

jest.mock('../../../../../lib/e2ee/rocketchat.e2e', () => ({
	e2e: {
		decryptMessage: jest.fn(),
	},
}));

const thread: IThreadMainMessage = {
	_id: 'threadId',
	rid: 'roomId',
	ts: new Date('2021-10-27T00:00:00.000Z'),
	tlm: new Date('2021-10-27T00:00:00.000Z'),
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'thread body',
	tcount: 1,
	replies: ['userId'],
};

const renderItem = (ignoredUser?: boolean) =>
	render(<ThreadListItem thread={thread} unread={[]} unreadUser={[]} unreadGroup={[]} ignoredUser={ignoredUser} onClick={jest.fn()} />, {
		wrapper: mockAppRoot().build(),
	});

it('should show the thread message', () => {
	renderItem(false);

	expect(screen.getByText('thread body')).toBeInTheDocument();
	expect(screen.queryByText('Message_Ignored')).not.toBeInTheDocument();
});

it('should hide the thread message when its author is ignored', () => {
	renderItem(true);

	expect(screen.queryByText('thread body')).not.toBeInTheDocument();
	expect(screen.getByText('Message_Ignored')).toBeInTheDocument();
});
