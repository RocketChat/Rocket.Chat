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
const COMPONENT_PATH = '../../../../../../client/views/room/MessageList/components/ThreadMessagePreview';
const defaultConfig = {
	'../../contexts/MessageContext': {
		useMessageActions: () => ({
			actions: {
				openThread: () => () => '',
			},
		}),
	},
	'../hooks/useParentMessage': {
		useParentMessage: () => '',
	},
	'../hooks/useMessageBody': {
		useMessageBody: () => <p>Parent Message</p>,
	},
	'../../../../../app/ui-utils/client': {
		MessageTypes: {
			getType: () => false,
		},
	},
	'./ThreadMessagePreviewBody': ({ message }: { message: any }) => <span>{message.msg}</span>,
};

describe('ThreadMessagePreview', () => {
	it('should render the message when exists', () => {
		const ThreadMessagePreview = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig).default;

		render(<ThreadMessagePreview message={baseMessage} sequential={true} />);

		expect(screen.getByText(baseMessage.msg)).to.exist;
	});

	it('should render ignored message', () => {
		const ThreadMessagePreview = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig).default;

		const message = { ...baseMessage, ignored: true };
		render(<ThreadMessagePreview message={message} sequential={true} />);

		expect(screen.getByText('Message_Ignored')).to.exist;
	});

	it('should render parent message', () => {
		const ThreadMessagePreview = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'../hooks/useParentMessage': {
				useParentMessage: () => ({
					isSuccess: true,
				}),
			},
		}).default;

		render(<ThreadMessagePreview message={baseMessage} sequential={false} />);

		expect(screen.getByText('Parent Message')).to.exist;
	});

	it('should render parent system message', () => {
		const ThreadMessagePreview = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'../hooks/useParentMessage': {
				useParentMessage: () => ({
					isSuccess: true,
				}),
			},
			'../../../../../app/ui-utils/client': {
				MessageTypes: {
					getType: () => ({
						message: 'System Message',
					}),
				},
			},
		}).default;

		render(<ThreadMessagePreview message={baseMessage} sequential={false} />);

		expect(screen.getByText('System Message')).to.exist;
	});
});
