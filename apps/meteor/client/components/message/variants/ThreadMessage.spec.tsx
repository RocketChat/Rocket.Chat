import type { IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ThreadMessage from './ThreadMessage';

const message: IThreadMessage = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message body',
	md: [
		{
			type: 'PARAGRAPH',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: 'message body',
				},
			],
		},
	],
	rid: 'roomId',
	tmid: 'threadId',
	_id: 'messageId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	urls: [],
};

it('should show normal message', () => {
	render(<ThreadMessage message={message} sequential={false} unread={false} ignoredUser={false} showUserAvatar={true} />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
});

it('should show fallback content for ignored user', () => {
	render(<ThreadMessage message={message} sequential={false} unread={false} ignoredUser={true} showUserAvatar={true} />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
});

it('should show the message body once the ignored placeholder is clicked', async () => {
	render(<ThreadMessage message={message} sequential={false} unread={false} ignoredUser={true} showUserAvatar={true} />, {
		wrapper: mockAppRoot().build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));

	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
});

it('should hide the message body when the user gets ignored without remounting', () => {
	const { rerender } = render(
		<ThreadMessage message={message} sequential={false} unread={false} ignoredUser={false} showUserAvatar={true} />,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByText('message body')).toBeInTheDocument();

	rerender(<ThreadMessage message={message} sequential={false} unread={false} ignoredUser={true} showUserAvatar={true} />);

	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
});
