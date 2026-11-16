import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ContactHistoryMessage from './ContactHistoryMessage';
import { createFakeMessage } from '../../../../../tests/mocks/data';
import { MessagesProvider } from '../../../../providers/MessagesProvider';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));

const message = createFakeMessage({
	u: { _id: 'visitor', username: 'visitor', name: 'Visitor' },
	msg: 'here is my file',
	attachments: [
		{ text: 'quoted text', author_name: 'bob', message_link: '/channel/general?msg=quoted' },
		{
			type: 'file',
			title: 'photo.png',
			title_link: '/file-upload/id/photo.png',
			image_url: '/file-upload/id/photo.png',
			image_alt: 'A photo',
			image_dimensions: { width: 1000, height: 1000 },
		},
	] as IMessage['attachments'],
});

const renderMessage = (root = mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', true)) =>
	render(<ContactHistoryMessage message={message} sequential={false} isNewDay={false} showUserAvatar />, {
		wrapper: root.wrap((children: ReactNode) => <MessagesProvider allowsInteraction={false}>{children}</MessagesProvider>).build(),
	});

it('shows the quote and the attachments of a message of the contact history, without a toolbar (message-attachments R22)', () => {
	renderMessage();

	expect(screen.getByText('quoted text')).toBeInTheDocument();
	expect(screen.getByRole('img', { name: 'A photo' })).toHaveAttribute('width', '360');
	expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
});

it("applies the viewer's attachment preferences to a message of the contact history (message-attachments R22)", () => {
	renderMessage(mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', true).withUserPreference('collapseMediaByDefault', true));

	expect(screen.queryByRole('img', { name: 'A photo' })).not.toBeInTheDocument();
});

it('draws the status indicators of a message of the contact history with the package (message-variants R45)', () => {
	render(<ContactHistoryMessage message={{ ...message, pinned: true }} sequential={false} isNewDay={false} showUserAvatar />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.wrap((children: ReactNode) => <MessagesProvider allowsInteraction={false}>{children}</MessagesProvider>)
			.build(),
	});

	expect(screen.getByTitle('Message_has_been_pinned')).toBeInTheDocument();
});
