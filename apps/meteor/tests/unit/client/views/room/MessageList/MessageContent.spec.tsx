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
const RoomMessageContent = proxyquire.noCallThru().load('../../../../../../client/components/message/variants/room/RoomMessageContent', {
	'katex/dist/katex.css': {},
	'meteor/meteor': {},
	'../../../../lib/presence': {
		UserPresence: () => '',
	},
	'../../../../views/room/contexts/MessageContext': {
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

	'../../../../views/room/MessageList/contexts/MessageListContext': {
		useTranslateAttachments: () => '',
		useMessageListShowReadReceipt: () => '',
	},
	'../../../../hooks/useUserData': {
		useUserData: () => '',
	},
	'../../content/UiKitSurface': () => null,
	'../../content/Attachments': () => null,
	'../../MessageContentBody': () => baseMessage.msg,
}).default;

// TODO: Fix this test
describe.skip('RoomMessageContent', () => {
	it('should render the message when exists', () => {
		render(<RoomMessageContent message={baseMessage} sequential={false} id={''} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
	});

	it('should render the message when has an empty message blocks', () => {
		const message = { ...baseMessage, blocks: [] };
		render(<RoomMessageContent message={message} sequential={false} id={''} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
	});

	it('should render the message when replies is undefined', () => {
		render(<RoomMessageContent message={{ ...baseMessage, replies: undefined, tcount: 0, tlm: date }} sequential={false} id={''} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
		expect(screen.getByTitle('Replies')).to.include.text('0');
	});
});
