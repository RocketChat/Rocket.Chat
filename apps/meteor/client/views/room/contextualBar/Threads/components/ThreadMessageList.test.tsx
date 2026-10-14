import { after, before, describe, it, mock } from 'node:test';

import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike, Mock } from 'jest-mock';
import { fn } from 'jest-mock';
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import { createFakeMessage, createFakeRoom } from '../../../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../../../tests/mocks/moduleScope';

let ThreadMessageList: (typeof import('./ThreadMessageList'))['default'];
let useThreadMessagesQuery: (typeof import('../hooks/useThreadMessagesQuery'))['useThreadMessagesQuery'];

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const mockVirtualizerHandle = {
	scrollToIndex: fn<FunctionLike>(),
	findItemIndex: fn<FunctionLike>(() => 0),
	scrollOffset: 100,
	scrollSize: 1000,
	viewportSize: 300,
};

const createThreadMessage = (index: number): IThreadMessage => {
	const ts = new Date(Date.UTC(2026, 0, index));

	return createFakeMessage<IThreadMessage>({
		_id: `reply-${index}`,
		rid: room._id,
		tmid: 'thread-id',
		msg: `reply ${index}`,
		ts,
		_updatedAt: ts,
		u: {
			_id: 'user-id',
			username: 'user',
			name: 'User',
		},
	});
};

describe('ThreadMessageList', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('virtua'), {
			exports: {
				default: (() => {
					const { Children, forwardRef, useImperativeHandle } = require('react') as typeof import('react');

					return {
						// `virtua` renders a plain container and wraps every child in a `div` of its own, so the list markup
						// under test cannot rely on `ul`/`li` semantics.
						VList: forwardRef(
							(
								{
									children,
									onScroll,
									shift: _shift,
									keepMounted: _keepMounted,
									...props
								}: {
									children: ReactNode;
									onScroll?: (offset: number) => void;
									shift?: boolean;
									keepMounted?: number[];
								},
								ref: any,
							) => {
								useImperativeHandle(ref, () => mockVirtualizerHandle);
								return (
									<div data-testid='thread-message-list' onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)} {...props}>
										{Children.map(children, (child) => (child ? <div>{child}</div> : child))}
									</div>
								);
							},
						),
					};
				})(),
			},
		});
		mock.module(require.resolve('@rocket.chat/fuselage-hooks'), {
			exports: {
				...require('@rocket.chat/fuselage-hooks'),
				useDebouncedCallback: (callback: (...args: any[]) => void) => callback,
			},
		});
		mock.module(require.resolve('@rocket.chat/ui-client'), {
			exports: {
				clientCallbacks: {
					add: fn<FunctionLike>(),
					remove: fn<FunctionLike>(),
					priority: { MEDIUM: 0 },
				},

				CustomVirtuaScrollbars: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CustomVirtuaScrollbars(
					{ children, ...props },
					ref,
				) {
					return (
						<div {...props}>
							<div ref={ref}>{children}</div>
							<div data-testid='overlay-scrollbar-handle' />
						</div>
					);
				}),
			},
		});
		mock.module('../hooks/useThreadMessagesQuery', {
			exports: {
				useThreadMessagesQuery: fn<FunctionLike>(),
			},
		});
		mock.module('../../../hooks/useDateScroll', {
			exports: {
				useDateScroll: () => ({
					bubbleRef: { current: null },
					handleDateScroll: fn<FunctionLike>(),
				}),
			},
		});
		mock.module('../../../contexts/RoomContext', {
			exports: {
				useRoom: () => room,
			},
		});
		mock.module('../../../MessageList/hooks/useKeepAtBottom', {
			exports: {
				useKeepAtBottom: () => ({ keepAtBottomRef: fn<FunctionLike>(), setKeepAtBottom: fn<FunctionLike>() }),
			},
		});
		mock.module('../../../hooks/useFirstUnreadMessageId', {
			exports: {
				useFirstUnreadMessageId: () => undefined,
			},
		});
		mock.module('../../../hooks/useMessageListNavigation', {
			exports: {
				useMessageListNavigation: () => ({ messageListRef: { current: null } }),
			},
		});
		mock.module('../../../MessageList/providers/MessageListProvider', {
			exports: {
				default: (
					() =>
					({ children }: { children: ReactNode }) => <>{children}</>
				)(),
			},
		});
		mock.module('../../../../../lib/utils/setMessageJumpQueryStringParameter', {
			exports: {
				setMessageJumpQueryStringParameter: fn<FunctionLike>(),
			},
		});
		mock.module('./ThreadMessageItem', {
			exports: {
				ThreadMessageItem: ({ message }: { message: IMessage }) => <div role='listitem'>{message._id}</div>,
			},
		});
		mock.module('../../../BubbleDate', {
			exports: {
				BubbleDate: forwardRef(function BubbleDate(_, ref) {
					return <time ref={ref as any} />;
				}),
			},
		});
		({ default: ThreadMessageList } = require('./ThreadMessageList'));
		({ useThreadMessagesQuery } = require('../hooks/useThreadMessagesQuery'));
	});

	after(leaveModuleScope);

	describe('ThreadMessageList', () => {
		it('fetches the previous page after a pointer interaction with the overlay scrollbar', async () => {
			const user = userEvent.setup();
			const fetchPreviousPage = fn<FunctionLike>().mockResolvedValue(undefined);
			const mainMessage = createFakeMessage<IThreadMainMessage>({
				_id: 'thread-id',
				rid: room._id,
				msg: 'main message',
				tcount: 1,
				u: {
					_id: 'user-id',
					username: 'user',
					name: 'User',
				},
			});
			(useThreadMessagesQuery as Mock<FunctionLike>).mockReturnValue({
				data: { messages: [createThreadMessage(1)] },
				isLoading: false,
				fetchNextPage: fn<FunctionLike>(),
				hasNextPage: false,
				isFetchingNextPage: false,
				fetchPreviousPage,
				hasPreviousPage: true,
				isFetchingPreviousPage: false,
				loadMessageAround: fn<FunctionLike>(),
			});

			render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom setShouldJumpToBottom={fn<FunctionLike>()} />, {
				wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true).build(),
			});

			fireEvent.scroll(screen.getByTestId('thread-message-list'));
			expect(fetchPreviousPage).not.toHaveBeenCalled();

			await user.pointer({ keys: '[MouseLeft>]', target: screen.getByTestId('overlay-scrollbar-handle') });
			fireEvent.scroll(screen.getByTestId('thread-message-list'));
			await user.pointer({ keys: '[/MouseLeft]' });

			expect(fetchPreviousPage).toHaveBeenCalledTimes(1);
		});
	});

	describe('ThreadMessageList accessibility', () => {
		const mainMessage = createFakeMessage<IThreadMainMessage>({
			_id: 'thread-id',
			rid: room._id,
			msg: 'main message',
			tcount: 1,
			u: {
				_id: 'user-id',
				username: 'user',
				name: 'User',
			},
		});

		const mockThreadMessagesQuery = (overrides: Record<string, unknown> = {}) => {
			(useThreadMessagesQuery as Mock<FunctionLike>).mockReturnValue({
				data: { messages: [createThreadMessage(1), createThreadMessage(2)] },
				isLoading: false,
				fetchNextPage: fn<FunctionLike>(),
				hasNextPage: false,
				isFetchingNextPage: false,
				fetchPreviousPage: fn<FunctionLike>(),
				hasPreviousPage: false,
				isFetchingPreviousPage: false,
				loadMessageAround: fn<FunctionLike>(),
				...overrides,
			});
		};

		const renderThreadMessageList = () =>
			render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom={false} setShouldJumpToBottom={fn<FunctionLike>()} />, {
				wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true).build(),
			});

		it('should render a labelled list exposing every message as a list item', () => {
			mockThreadMessagesQuery();

			renderThreadMessageList();

			const list = screen.getByRole('list');

			expect(list).toHaveAccessibleName();
			// the two replies plus the main message
			expect(within(list).getAllByRole('listitem')).toHaveLength(3);
		});

		const states: [string, Record<string, unknown>][] = [
			['default', {}],
			['loading', { isLoading: true, data: undefined }],
			['loading previous messages', { hasPreviousPage: true, isFetchingPreviousPage: true }],
			['loading next messages', { hasNextPage: true, isFetchingNextPage: true }],
			['able to load next messages', { hasNextPage: true }],
		];

		states.forEach(([_state, overrides]) => {
			it(`should have no accessibility violations when ${_state}`, async () => {
				mockThreadMessagesQuery(overrides);

				const { container } = renderThreadMessageList();

				expect(await axe(container)).toHaveNoViolations();
			});
		});
	});
});
