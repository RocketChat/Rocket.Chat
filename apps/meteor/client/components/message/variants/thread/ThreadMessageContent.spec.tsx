import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { MessageDisplayContext, messageDisplayDefaultValue } from '@rocket.chat/ui-message-list';
import { render, screen } from '@testing-library/react';

import ThreadMessageContent from './ThreadMessageContent';

jest.mock('../../hooks/useMessageBroadcast', () => ({ useMessageBroadcast: () => true }));

const message = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: { _id: 'author', name: 'author', username: 'author' },
	msg: 'message body',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'message body' }] }],
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	urls: [],
} as unknown as IMessage;

it.each([
	[true, true],
	[false, false],
])('shows the broadcast reply of a message when interaction is allowed: %s (message-variants R38)', (allowsInteraction, shown) => {
	render(<ThreadMessageContent message={message as never} />, {
		wrapper: mockAppRoot()
			.wrap((children) => (
				<MessageDisplayContext.Provider value={{ ...messageDisplayDefaultValue, allowsInteraction }}>
					{children}
				</MessageDisplayContext.Provider>
			))
			.build(),
	});

	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(!!screen.queryByRole('button')).toBe(shown);
});
