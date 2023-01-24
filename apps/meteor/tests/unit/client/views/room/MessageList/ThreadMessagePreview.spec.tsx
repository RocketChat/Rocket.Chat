import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import React from 'react';
import type { IMessage } from '@rocket.chat/core-typings';

import { queryClient } from '../../../../../../client/lib/queryClient';
import FakeRoomProvider from '../../../../../mocks/client/FakeRoomProvider';
import RouterContextMock from '../../../../../mocks/client/RouterContextMock';
import { createFakeMessageWithMd } from '../../../../../mocks/data';
import type * as ThreadMessagePreviewModule from '../../../../../../client/components/message/variants/ThreadMessagePreview';

const fakeMessage = createFakeMessageWithMd({
	msg: 'message',
});

const modulePath = '../../../../../../client/components/message/variants/ThreadMessagePreview';
const stubs = {
	'../MessageContext': {
		useMessageContext: () => ({
			actions: {},
		}),
	},
	'../../../views/room/MessageList/hooks/useParentMessage': {
		useParentMessage: () => '',
	},
	'../../../views/room/MessageList/hooks/useMessageBody': {
		useMessageBody: () => <p>Parent Message</p>,
	},
	'../../../../app/ui-utils/client': {
		MessageTypes: {
			getType: () => false,
		},
	},
	'./threadPreview/ThreadMessagePreviewBody': ({ message }: { message: IMessage }) => <span>{message.msg}</span>,
};

describe('ThreadMessagePreview', () => {
	const ProvidersMock = ({ children }: { children: React.ReactNode }) => {
		return (
			<QueryClientProvider client={queryClient}>
				<RouterContextMock>
					<FakeRoomProvider>{children}</FakeRoomProvider>
				</RouterContextMock>
			</QueryClientProvider>
		);
	};

	it('should render the message when exists', () => {
		const { default: ThreadMessagePreview } = proxyquire.noCallThru().load<typeof ThreadMessagePreviewModule>(modulePath, stubs);

		render(<ThreadMessagePreview message={fakeMessage} sequential={true} />, { wrapper: ProvidersMock });

		expect(screen.getByText(fakeMessage.msg)).to.exist;
	});

	it('should render ignored message', () => {
		const { default: ThreadMessagePreview } = proxyquire.noCallThru().load<typeof ThreadMessagePreviewModule>(modulePath, stubs);

		const message = { ...fakeMessage, ignored: true };
		render(<ThreadMessagePreview message={message} sequential={true} />, { wrapper: ProvidersMock });

		expect(screen.getByText('Message_Ignored')).to.exist;
	});

	it('should render parent message', () => {
		const { default: ThreadMessagePreview } = proxyquire.noCallThru().load<typeof ThreadMessagePreviewModule>(modulePath, {
			...stubs,
			'../../../views/room/MessageList/hooks/useParentMessage': {
				useParentMessage: () => ({
					isSuccess: true,
				}),
			},
		});

		render(<ThreadMessagePreview message={fakeMessage} sequential={false} />, { wrapper: ProvidersMock });

		expect(screen.getByText('Parent Message')).to.exist;
	});

	it('should render parent system message', () => {
		const { default: ThreadMessagePreview } = proxyquire.noCallThru().load<typeof ThreadMessagePreviewModule>(modulePath, {
			...stubs,
			'../../../views/room/MessageList/hooks/useParentMessage': {
				useParentMessage: () => ({
					isSuccess: true,
				}),
			},
			'../../../../app/ui-utils/client': {
				MessageTypes: {
					getType: () => ({
						message: 'System Message',
					}),
				},
			},
		});

		render(<ThreadMessagePreview message={fakeMessage} sequential={false} />, { wrapper: ProvidersMock });

		expect(screen.getByText('System Message')).to.exist;
	});
});
