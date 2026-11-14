import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ContextMessage from './ContextMessage';
import { createFakeMessage } from '../../../../../tests/mocks/data';
import { MessagesProvider } from '../../../../providers/MessagesProvider';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../MessageReportInfo', () => ({ __esModule: true, default: () => null }));
jest.mock('../hooks/useDeleteMessage', () => ({ __esModule: true, default: () => jest.fn() }));
jest.mock('../hooks/useDismissMessageAction', () => ({ useDismissMessageAction: () => ({ action: jest.fn() }) }));

const reported = createFakeMessage({
	u: { _id: 'author', username: 'author', name: 'Author' },
	msg: 'look',
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

const renderReported = (root = mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', true)) =>
	render(
		<ContextMessage message={reported} room={{ name: 'general' } as never} deleted={false} onRedirect={jest.fn()} onChange={jest.fn()} />,
		{
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider allowsInteraction={false}>{children}</MessagesProvider>).build(),
		},
	);

it('shows a reported message with its quote and attachments, sized and resolved as the lists do (message-attachments R22)', () => {
	renderReported();

	expect(screen.getByText('quoted text')).toBeInTheDocument();
	expect(screen.getByRole('img', { name: 'A photo' })).toHaveAttribute('width', '360');
});

it("applies the viewer's attachment preferences to a reported message (message-attachments R22)", () => {
	renderReported(mockAppRoot().withJohnDoe().withUserPreference('autoImageLoad', true).withUserPreference('collapseMediaByDefault', true));

	expect(screen.queryByRole('img', { name: 'A photo' })).not.toBeInTheDocument();
});
