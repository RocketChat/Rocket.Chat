import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

const date = new Date('2021-10-27T00:00:00.000Z');
const baseMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message',
	md: [
		{
			type: 'PARAGRAPH',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: 'message',
				},
			],
		},
	],
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

const Message = proxyquire.noCallThru().load('../../../../../../client/views/room/MessageList/components/Message.tsx', {
	'../../../../components/avatar/UserAvatar': () => <p>user avatar</p>,
	'../../contexts/MessageContext': {
		useMessageActions: () => ({
			actions: {
				openUserCard: () => '',
			},
		}),
	},
	'../contexts/MessageHighlightContext': {
		useIsMessageHighlight: () => false,
	},
	'../contexts/SelectedMessagesContext': {
		useIsSelecting: () => '',
		useToggleSelect: () => '',
		useIsSelectedMessage: () => '',
		useCountSelected: () => '',
	},
	'./MessageContentIgnored': () => <p>message ignored</p>,
	'./MessageContent': () => baseMessage.msg,
	'./MessageHeader': () => <p>message header</p>,
	'./MessageIndicators': { MessageIndicators: () => <p>message indicators</p> },
	'./Toolbox': () => <p>toolbox</p>,
}).default;

describe('Message', () => {
	it('should show normal message', () => {
		render(<Message message={baseMessage} isUserIgnored={false} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
	});

	it('should show ignored message', () => {
		render(<Message message={baseMessage} isUserIgnored={true} />);

		expect(screen.getByText('message ignored')).to.exist;
	});

	it('should show ignored message', () => {
		render(<Message message={{ ...baseMessage, ignored: true }} isUserIgnored={false} />);

		expect(screen.getByText('message ignored')).to.exist;
	});
});
