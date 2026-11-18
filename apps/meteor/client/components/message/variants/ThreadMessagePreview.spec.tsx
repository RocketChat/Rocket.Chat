import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ThreadMessagePreview from './ThreadMessagePreview';

const goToThread = jest.fn();

jest.mock('../../../views/room/hooks/useGoToThread', () => ({
	useGoToThread: () => goToThread,
}));

const parentMessage: IMessage = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: { _id: 'userId', name: 'userName', username: 'userName' },
	msg: 'parent body',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'parent body' }] }],
	rid: 'roomId',
	_id: 'threadId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
};

jest.mock('../../../views/room/MessageList/hooks/useParentMessage', () => ({
	useParentMessage: () => ({ isSuccess: true, isLoading: false, data: parentMessage }),
}));

const message: IThreadMessage = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: { _id: 'userId', name: 'userName', username: 'userName' },
	msg: 'reply body',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'reply body' }] }],
	rid: 'roomId',
	tmid: 'threadId',
	_id: 'replyId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
};

beforeEach(() => {
	goToThread.mockClear();
});

it('should open the thread at the reply when the reply is clicked under the parent header', async () => {
	render(<ThreadMessagePreview message={message} sequential={false} showUserAvatar />, { wrapper: mockAppRoot().build() });

	await userEvent.click(screen.getByText('reply body'));

	expect(goToThread).toHaveBeenCalledTimes(1);
	expect(goToThread).toHaveBeenCalledWith({ rid: 'roomId', tmid: 'threadId', msg: 'replyId' });
});

it('should open the thread at the reply when the parent header is clicked', async () => {
	render(<ThreadMessagePreview message={message} sequential={false} showUserAvatar />, { wrapper: mockAppRoot().build() });

	await userEvent.click(screen.getByText('parent body'));

	expect(goToThread).toHaveBeenCalledTimes(1);
	expect(goToThread).toHaveBeenCalledWith({ rid: 'roomId', tmid: 'threadId', msg: 'replyId' });
});

it('should open the thread at the reply when a sequential reply is clicked', async () => {
	render(<ThreadMessagePreview message={message} sequential showUserAvatar />, { wrapper: mockAppRoot().build() });

	await userEvent.click(screen.getByText('reply body'));

	expect(goToThread).toHaveBeenCalledWith({ rid: 'roomId', tmid: 'threadId', msg: 'replyId' });
});

it.each(['{Enter}', ' '])('should open the thread at the reply when %s is pressed on the focused preview', async (key) => {
	render(<ThreadMessagePreview message={message} sequential={false} showUserAvatar />, { wrapper: mockAppRoot().build() });

	screen.getByRole('link').focus();
	await userEvent.keyboard(key);

	expect(goToThread).toHaveBeenCalledTimes(1);
	expect(goToThread).toHaveBeenCalledWith({ rid: 'roomId', tmid: 'threadId', msg: 'replyId' });
});
