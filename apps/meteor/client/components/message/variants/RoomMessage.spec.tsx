import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RoomMessage from './RoomMessage';

const message: IMessage = {
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
	_id: 'messageId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	urls: [],
};

jest.mock('../header/hooks/useMessageRoles', () => ({
	useMessageRoles: () => [],
}));
jest.mock('../../../lib/utils/fireGlobalEvent', () => ({ fireGlobalEvent: () => undefined }));
jest.mock('../../../views/room/hooks/useGoToRoom', () => ({ useGoToRoom: () => undefined }));
jest.mock('../../../views/room/contextualBar/Threads/hooks/useGetMessageByID', () => undefined);
jest.mock('../../../views/room/MessageList/hooks/useAutoTranslate', () => ({
	useAutoTranslate: () => ({
		autoTranslateEnabled: false,
		autoTranslateLanguage: '',
		showAutoTranslate: () => false,
	}),
}));
jest.mock('../../../lib/actionLinks', () => undefined);

it('should show normal message', () => {
	render(
		<RoomMessage
			message={message}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
});

it('should show fallback content for ignored user', () => {
	render(
		<RoomMessage
			message={message}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={true}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
});

it('should show ignored message', () => {
	render(
		<RoomMessage
			message={{ ...message, ignored: true }}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
});
