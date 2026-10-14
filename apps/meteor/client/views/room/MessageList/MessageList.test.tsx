import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike, Mock } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';
import type { ReactNode } from 'react';

import type { MessageListProps } from './MessageList';
import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let MessageList: (typeof import('./MessageList'))['MessageList'];
let useMessages: (typeof import('./hooks/useMessages'))['useMessages'];
let RoomManager: (typeof import('../../../lib/RoomManager'))['RoomManager'];
let useFirstUnreadMessageId: (typeof import('../hooks/useFirstUnreadMessageId'))['useFirstUnreadMessageId'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockVirtualizerHandle: {
	scrollToIndex: Mock<FunctionLike>;
	scrollTo: Mock<FunctionLike>;
	findItemIndex: Mock<FunctionLike>;
	scrollOffset: number;
	scrollSize: number;
	viewportSize: number;
	cache?: unknown;
} = {
	scrollToIndex: fn<FunctionLike>(),
	scrollTo: fn<FunctionLike>(),
	findItemIndex: fn<FunctionLike>((offset: number) => offset),
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
	cache: undefined,
};

let lastVListCacheProp: unknown;

const createMessage = (_id: string, ts = new Date()): IMessage =>
	({
		_id,
		rid: 'room-id',
		msg: `message ${_id}`,
		ts,
		_updatedAt: ts,

		u: {
			_id: 'user-id',
			username: 'user',
		},
	}) as IMessage;

const defaultProps = {
	rid: 'room-id' as IRoom['_id'],
	canPreview: true,
	hasMorePreviousMessages: false,
	isLoadingMoreMessages: false,
	user: { _id: 'user-id', username: 'user' } as IUser,
	room: { _id: 'room-id', t: 'c' } as IRoom,
	retentionPolicy: undefined,
	hasMoreNextMessages: false,
	shouldJumpToBottom: false,
	setShouldJumpToBottom: fn<FunctionLike>(),
	isAtBottom: { current: false },
	isJumpingToMessage: false,
	setIsJumpingToMessage: fn<FunctionLike>(),
	setUnreadCount: fn<FunctionLike>(),
	setLastMessageDate: fn<FunctionLike>(),
	debouncedClearNewMessagesOnScroll: fn<FunctionLike>(),
	handleDateScroll: fn<FunctionLike>(),
	debouncedMessageRead: fn<FunctionLike>(),
	setKeepAtBottom: fn<FunctionLike>(),
};

describe('MessageList', () => {
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
									cache,
									...props
								}: {
									children: ReactNode;
									onScroll?: (offset: number) => void;
									shift?: boolean;
									keepMounted?: number[];
									cache?: unknown;
								},
								ref: any,
							) => {
								useImperativeHandle(ref, () => mockVirtualizerHandle);
								lastVListCacheProp = cache;
								return (
									<div data-testid='message-list' onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)} {...props}>
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
				useDebouncedCallback: (callback: (...args: any[]) => void) => callback,
			},
		});
		mock.module('../../../lib/RoomManager', {
			exports: {
				RoomManager: {
					getStore: fn<FunctionLike>(),
				},
			},
		});
		mock.module('./hooks/useMessages', {
			exports: {
				useMessages: fn<FunctionLike>(),
			},
		});
		mock.module('./hooks/useTryToJumpToMessage', { exports: { default: (() => fn<FunctionLike>())() } });
		mock.module('../hooks/useFirstUnreadMessageId', {
			exports: {
				useFirstUnreadMessageId: fn<FunctionLike>(),
			},
		});
		mock.module('../contexts/RoomContext', {
			exports: {
				useRoomSubscription: fn<FunctionLike>(() => undefined),
			},
		});
		mock.module('../contexts/ChatContext', {
			exports: {
				useChat: fn<FunctionLike>(() => ({
					readStateManager: {
						setIsUnreadMarkVisibleCallback: fn<FunctionLike>(),
					},
				})),
			},
		});
		mock.module('./MessageListItem', {
			exports: {
				MessageListItem: ({ message }: { message: IMessage }) => (
					<div role='listitem' data-testid='message-list-item'>
						{message.msg}
					</div>
				),
			},
		});
		mock.module('./providers/MessageListProvider', {
			exports: {
				default: (
					() =>
					({ children }: { children: ReactNode }) => <>{children}</>
				)(),
			},
		});
		mock.module('../providers/SelectedMessagesProvider', {
			exports: {
				SelectedMessagesProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
			},
		});
		mock.module('../body/LoadingMessagesIndicator', { exports: { default: (() => () => <span>Loading</span>)() } });
		mock.module('../body/RetentionPolicyWarning', { exports: { default: (() => () => <span>Retention policy warning</span>)() } });
		mock.module('../body/RoomForeword/RoomForeword', { exports: { default: (() => () => <span>Room foreword</span>)() } });
		({ MessageList } = require('./MessageList'));
		({ useMessages } = require('./hooks/useMessages'));
		({ RoomManager } = require('../../../lib/RoomManager'));
		({ useFirstUnreadMessageId } = require('../hooks/useFirstUnreadMessageId'));
	});

	after(leaveModuleScope);

	describe('MessageList scroll position', () => {
		let root: ReturnType<typeof mockAppRoot>;

		beforeEach(() => {
			mocker.clearAllMocks();
			mockVirtualizerHandle.scrollToIndex.mockClear();
			mockVirtualizerHandle.scrollTo.mockClear();
			mockVirtualizerHandle.findItemIndex.mockImplementation((offset: number) => offset);
			mockVirtualizerHandle.scrollOffset = 0;
			mockVirtualizerHandle.scrollSize = 1000;
			mockVirtualizerHandle.viewportSize = 300;
			mockVirtualizerHandle.cache = undefined;
			lastVListCacheProp = undefined;
			(useMessages as Mock<FunctionLike>).mockReturnValue([createMessage('message-1'), createMessage('message-2')]);
			(useFirstUnreadMessageId as Mock<FunctionLike>).mockReturnValue(undefined);
			root = mockAppRoot().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true);
		});

		it('should restore room scroll position based on store', () => {
			const store = {
				scroll: 123,
				atBottom: false,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			expect(screen.getByTestId('message-list')).toBeInTheDocument();
			expect(mockVirtualizerHandle.scrollTo).toHaveBeenCalledWith(123);
			expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalled();
		});

		it('should jump to bottom if atBottom is true', () => {
			const store = {
				scroll: 123,
				atBottom: true,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

			render(<MessageList {...defaultProps} shouldJumpToBottom={true} />, { wrapper: root.build() });

			expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(2, { align: 'center' });
		});

		it('should jump to bottom if unreads are present', () => {
			const store = {
				scroll: 123,
				atBottom: false,
				update: fn<FunctionLike>(),
			};
			(useFirstUnreadMessageId as Mock<FunctionLike>).mockReturnValue('message-1');
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

			render(<MessageList {...defaultProps} shouldJumpToBottom={true} />, { wrapper: root.build() });

			expect(defaultProps.setShouldJumpToBottom).toHaveBeenCalledWith(true);
		});

		it('should do nothing if no previous scroll position is stored', () => {
			const store = {
				scroll: undefined,
				atBottom: false,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			expect(screen.getByTestId('message-list')).toBeInTheDocument();
			expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalled();
			expect(mockVirtualizerHandle.scrollTo).not.toHaveBeenCalled();
		});

		it('should update store based on scroll position', async () => {
			const store = {
				scroll: 1,
				atBottom: false,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);
			mockVirtualizerHandle.scrollOffset = 50;

			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			fireEvent.scroll(screen.getByTestId('message-list'));

			await waitFor(() => {
				expect(store.update).toHaveBeenCalledWith({ scroll: 50, atBottom: false, cache: undefined, cacheMessageCount: 2 });
			});
		});

		it('should persist the virtualizer cache snapshot alongside the scroll position and the message count it was measured against', async () => {
			const store = {
				scroll: 1,
				atBottom: false,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);
			mockVirtualizerHandle.scrollOffset = 50;
			const cacheSnapshot = { fakeCache: true };
			mockVirtualizerHandle.cache = cacheSnapshot;

			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			fireEvent.scroll(screen.getByTestId('message-list'));

			await waitFor(() => {
				expect(store.update).toHaveBeenCalledWith({ scroll: 50, atBottom: false, cache: cacheSnapshot, cacheMessageCount: 2 });
			});
		});

		it('should seed the virtualizer with the cache snapshot stored for the room when the message count still matches', () => {
			const cacheSnapshot = { fakeCache: true };
			const store = {
				scroll: 123,
				atBottom: false,
				cache: cacheSnapshot,
				cacheMessageCount: 2,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			expect(lastVListCacheProp).toBe(cacheSnapshot);
		});

		it('should not seed the virtualizer with a cache snapshot captured at a different message count', () => {
			const cacheSnapshot = { fakeCache: true };
			const store = {
				scroll: 123,
				atBottom: false,
				cache: cacheSnapshot,
				cacheMessageCount: 5,
				update: fn<FunctionLike>(),
			};
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			expect(lastVListCacheProp).toBeUndefined();
		});
	});

	describe('MessageList accessibility', () => {
		let root: ReturnType<typeof mockAppRoot>;

		beforeEach(() => {
			mocker.clearAllMocks();
			(useMessages as Mock<FunctionLike>).mockReturnValue([createMessage('message-1'), createMessage('message-2')]);
			(useFirstUnreadMessageId as Mock<FunctionLike>).mockReturnValue(undefined);
			(RoomManager.getStore as Mock<FunctionLike>).mockReturnValue({ scroll: undefined, atBottom: false, update: fn<FunctionLike>() });
			root = mockAppRoot().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true);
		});

		it('should render a labelled list exposing every message as a list item', () => {
			render(<MessageList {...defaultProps} />, { wrapper: root.build() });

			const list = screen.getByRole('list');

			expect(list).toHaveAccessibleName();
			// the two messages plus the foreword
			expect(within(list).getAllByRole('listitem')).toHaveLength(3);
		});

		const states: [string, Partial<MessageListProps>][] = [
			['default', {}],
			['loading previous messages', { hasMorePreviousMessages: true, isLoadingMoreMessages: true }],
			['loading next messages', { hasMoreNextMessages: true, isLoadingMoreMessages: true }],
			[
				'showing the retention policy warning',
				{ retentionPolicy: { enabled: true, isActive: true, filesOnly: false, excludePinned: false, ignoreThreads: false, maxAge: 30 } },
			],
			['without preview permission', { canPreview: false }],
		];

		states.forEach(([_state, props]) => {
			it(`should have no accessibility violations when ${_state}`, async () => {
				const { container } = render(<MessageList {...defaultProps} {...props} />, { wrapper: root.build() });

				expect(await axe(container)).toHaveNoViolations();
			});
		});
	});
});
