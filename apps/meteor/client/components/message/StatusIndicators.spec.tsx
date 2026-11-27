import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import StatusIndicators from './StatusIndicators';

const message: IMessage = {
	_id: 'messageId',
	rid: 'roomId',
	ts: new Date('2021-10-27T00:00:00.000Z'),
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	u: { _id: 'userId', username: 'userName' },
	msg: 'message body',
};

const wrapper = mockAppRoot().withTranslations('en', 'core', { Sent_with_AI: 'Sent with AI' }).build();

it('should show the AI indicator on a message sent with AI', () => {
	render(<StatusIndicators message={{ ...message, sentWithAI: true }} />, { wrapper });

	expect(screen.getByRole('img', { name: 'Sent with AI' })).toBeInTheDocument();
});

it('should not show the AI indicator on other messages', () => {
	render(<StatusIndicators message={message} />, { wrapper });

	expect(screen.queryByRole('img', { name: 'Sent with AI' })).not.toBeInTheDocument();
});
