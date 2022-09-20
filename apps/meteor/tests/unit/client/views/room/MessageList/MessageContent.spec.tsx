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
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};
const MessageContent = proxyquire.noCallThru().load('../../../../../../client/views/room/MessageList/components/MessageContent', {
	'../../../../lib/presence': {
		UserPresence: () => '',
	},
	'../../contexts/MessageContext': {
		useMessageActions: () => ({
			actions: {
				openRoom: () => '',
				openThread: () => () => '',
				replyBroadcast: () => '',
			},
		}),
		useMessageOembedIsEnabled: () => '',
		useMessageRunActionLink: () => '',
	},

	'../../contexts/MessageListContext': {
		useTranslateAttachments: () => '',
		useMessageListShowReadReceipt: () => '',
	},
	'../../../../hooks/useUserData': {
		useUserData: () => '',
	},
	'../../../blocks/MessageBlock': () => '',
	'./MessageContentBody': () => baseMessage.msg,
}).default;

describe('MessageContent', () => {
	it('should render the message when exists', () => {
		render(<MessageContent message={baseMessage} sequential={false} id={''} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
	});

	it('should render the message when replies is undefined', () => {
		render(<MessageContent message={{ ...baseMessage, replies: undefined, tcount: 0, tlm: date }} sequential={false} id={''} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
		expect(screen.getByTitle('Replies')).to.include.text('0');
	});
});
