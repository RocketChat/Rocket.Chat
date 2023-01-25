import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import type { ReactNode } from 'react';
import React from 'react';

import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import RouterContextMock from '../../../../tests/mocks/client/RouterContextMock';
import { createFakeMessageWithMd } from '../../../../tests/mocks/data';
import { queryClient } from '../../../lib/queryClient';
import type * as ThreadMessagePreviewModule from './ThreadMessagePreview';

describe('ThreadMessagePreview', () => {
	const fakeMessage = createFakeMessageWithMd<IThreadMessage>({
		msg: 'message',
	});

	const loadMock = (stubs?: Record<string, unknown>) => {
		return proxyquire.noCallThru().load<typeof ThreadMessagePreviewModule>('./ThreadMessagePreview', {
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
			...stubs,
		}).default;
	};

	const ProvidersMock = ({ children }: { children: ReactNode }) => {
		return (
			<QueryClientProvider client={queryClient}>
				<RouterContextMock>
					<FakeRoomProvider>{children}</FakeRoomProvider>
				</RouterContextMock>
			</QueryClientProvider>
		);
	};

	it('should render the message when exists', () => {
		const ThreadMessagePreview = loadMock();

		render(<ThreadMessagePreview message={fakeMessage} sequential={true} />, { wrapper: ProvidersMock });

		expect(screen.getByText(fakeMessage.msg)).to.exist;
	});

	it('should render ignored message', () => {
		const ThreadMessagePreview = loadMock();

		const message = { ...fakeMessage, ignored: true };
		render(<ThreadMessagePreview message={message} sequential={true} />, { wrapper: ProvidersMock });

		expect(screen.getByText('Message_Ignored')).to.exist;
	});

	it('should render parent message', () => {
		const ThreadMessagePreview = loadMock({
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
		const ThreadMessagePreview = loadMock({
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
