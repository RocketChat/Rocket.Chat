import type { IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ThreadMessageContent from './ThreadMessageContent';
import { mockMessageProviders } from '../../../../../tests/utils/mockMessageProviders';

it('should show the body, quotes and reactions of a thread message', () => {
	const message = createFakeMessage<IThreadMessage>({
		_id: 'reply',
		tmid: 'thread-main',
		msg: 'a reply',
		reactions: { ':smile:': { usernames: ['alice'] } },
		attachments: [{ text: 'quoted text', author_name: 'bob', author_icon: '', message_link: '/channel/general?msg=quoted' }],
	});

	render(<ThreadMessageContent message={message} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByText('a reply')).toBeInTheDocument();
	expect(screen.getByText('quoted text')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'React_with__reaction__' })).toBeInTheDocument();
});
