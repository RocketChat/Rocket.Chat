import type { IMessage } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';

import type { default as _RoomMessage } from '../../../../../../client/components/message/variants/RoomMessage';

const date = new Date('2021-10-27T00:00:00.000Z');
const baseMessage: IMessage = {
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

const RoomMessage = proxyquire.noCallThru().load('../../../../../../client/components/message/variants/RoomMessage.tsx', {
	'../../avatar/UserAvatar': () => <p>user avatar</p>,
	'../../../views/room/MessageList/contexts/MessageHighlightContext': {
		useIsMessageHighlight: () => false,
	},
	'../../../views/room/MessageList/contexts/SelectedMessagesContext': {
		useIsSelecting: () => '',
		useToggleSelect: () => '',
		useIsSelectedMessage: () => '',
		useCountSelected: () => '',
	},
	'../IgnoredContent': () => <p>message ignored</p>,
	'./room/RoomMessageContent': () => baseMessage.msg,
	'../MessageHeader': () => <p>message header</p>,
	'../StatusIndicators': { MessageIndicators: () => <p>message indicators</p> },
	'../MessageToolboxHolder': () => <p>toolbox</p>,
}).default as typeof _RoomMessage;

describe('Message', () => {
	it('should show normal message', () => {
		render(
			<RoomMessage
				message={baseMessage}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={false}
				showUserAvatar={true}
			/>,
		);

		expect(screen.getByText(baseMessage.msg)).to.exist;
	});

	it('should show ignored message', () => {
		render(
			<RoomMessage
				message={baseMessage}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={true}
				showUserAvatar={true}
			/>,
		);

		expect(screen.getByText('message ignored')).to.exist;
	});

	it('should show ignored message', () => {
		render(
			<RoomMessage
				message={{ ...baseMessage, ignored: true }}
				sequential={false}
				all={false}
				mention={false}
				unread={false}
				ignoredUser={false}
				showUserAvatar={true}
			/>,
		);

		expect(screen.getByText('message ignored')).to.exist;
	});
});
