import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../../../../../../client/lib/queryClient';
import FakeRoomProvider from '../../../../../mocks/client/FakeRoomProvider';
import { createFakeMessageWithMd } from '../../../../../mocks/data';
import type * as RoomMessageContentModule from '../../../../../../client/components/message/variants/room/RoomMessageContent';
import { MessageContext } from '../../../../../../client/components/message/MessageContext';
import RouterContextMock from '../../../../../mocks/client/RouterContextMock';

describe('RoomMessageContent', () => {
	const fakeMessage = createFakeMessageWithMd({
		msg: 'message',
	});

	const { default: RoomMessageContent } = proxyquire
		.noCallThru()
		.load<typeof RoomMessageContentModule>('../../../../../../client/components/message/variants/room/RoomMessageContent', {
			'meteor/meteor': {},
			'meteor/kadira:flow-router': {},
			'../../../../lib/presence': {
				UserPresence: () => '',
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
			'../../MessageContentBody': () => fakeMessage.msg,
			'../../content/DiscussionMetrics': () => null,
			'../../content/MessageActions': () => null,
		});

	const ProvidersMock = ({ children }: { children: React.ReactNode }) => {
		return (
			<QueryClientProvider client={queryClient}>
				<RouterContextMock>
					<FakeRoomProvider>
						<MessageContext.Provider
							value={{
								actions: {
									openUserCard: () => () => undefined,
								},
							}}
						>
							{children}
						</MessageContext.Provider>
					</FakeRoomProvider>
				</RouterContextMock>
			</QueryClientProvider>
		);
	};

	it('should render the message when exists', () => {
		render(<RoomMessageContent message={fakeMessage} all={false} mention={false} unread={false} />, {
			wrapper: ProvidersMock,
		});

		expect(screen.getByText(fakeMessage.msg)).to.exist;
	});

	it('should render the message when has an empty message blocks', () => {
		render(<RoomMessageContent message={{ ...fakeMessage, blocks: [] }} all={false} mention={false} unread={false} />, {
			wrapper: ProvidersMock,
		});

		expect(screen.getByText(fakeMessage.msg)).to.exist;
	});

	it('should render the message when replies is undefined', () => {
		render(
			<RoomMessageContent
				message={{ ...fakeMessage, replies: undefined, tcount: 0, tlm: fakeMessage.ts }}
				all={false}
				mention={false}
				unread={false}
			/>,
			{
				wrapper: ProvidersMock,
			},
		);

		expect(screen.getByText(fakeMessage.msg)).to.exist;
		expect(screen.getByTitle('Replies')).to.include.text('0');
	});
});
