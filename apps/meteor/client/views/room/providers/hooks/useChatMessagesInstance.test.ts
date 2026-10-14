import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { ISubscription } from '@rocket.chat/core-typings';
import type { IActionManager } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';
import type { E2ERoomState } from '../../../../lib/e2ee/E2ERoomState';

let useUserId: (typeof import('@rocket.chat/ui-contexts'))['useUserId'];
let useChatMessagesInstance: (typeof import('./useChatMessagesInstance'))['useChatMessagesInstance'];
let useEmojiPicker: (typeof import('../../../../contexts/EmojiPickerContext'))['useEmojiPicker'];
let ChatMessages: (typeof import('../../../../lib/ChatMessages'))['ChatMessages'];
let useUiKitActionManager: (typeof import('../../../../uikit/hooks/useUiKitActionManager'))['useUiKitActionManager'];
let useRoomSubscription: (typeof import('../../contexts/RoomContext'))['useRoomSubscription'];
let useE2EERoomState: (typeof import('../../hooks/useE2EERoomState'))['useE2EERoomState'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const updateSubscriptionMock = fn<FunctionLike>();

describe('useChatMessagesInstance', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				useUserId: fn<FunctionLike>(),
			},
		});
		mock.module('../../contexts/RoomContext', {
			exports: {
				useRoomSubscription: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../uikit/hooks/useUiKitActionManager', {
			exports: {
				useUiKitActionManager: fn<FunctionLike>(),
			},
		});
		mock.module('../../hooks/useE2EERoomState', {
			exports: {
				useE2EERoomState: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../contexts/EmojiPickerContext', {
			exports: {
				useEmojiPicker: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../lib/ChatMessages', {
			exports: {
				default: (() => {
					return {
						ChatMessages: fn<FunctionLike>().mockImplementation(() => {
							return {
								release: fn<FunctionLike>(),
								readStateManager: {
									updateSubscription: updateSubscriptionMock,
									subscribeToMessages: fn<FunctionLike>(),
								},
							};
						}),
					};
				})(),
			},
		});
		({ useUserId } = require('@rocket.chat/ui-contexts'));
		({ useChatMessagesInstance } = require('./useChatMessagesInstance'));
		({ useEmojiPicker } = require('../../../../contexts/EmojiPickerContext'));
		({ ChatMessages } = require('../../../../lib/ChatMessages'));
		({ useUiKitActionManager } = require('../../../../uikit/hooks/useUiKitActionManager'));
		({ useRoomSubscription } = require('../../contexts/RoomContext'));
		({ useE2EERoomState } = require('../../hooks/useE2EERoomState'));
	});

	after(leaveModuleScope);
	let mockUid: string;
	let mockSubscription: Pick<ISubscription, 'u' | 't' | 'rid'>;
	let mockActionManager: IActionManager | undefined;
	let mockE2EERoomState: E2ERoomState;
	let mockEmojiPicker: {
		open: Mock<FunctionLike>;
		isOpen: boolean;
		close: Mock<FunctionLike>;
	};

	beforeEach(() => {
		mocker.clearAllMocks();

		mockUid = 'mockUid';
		mockSubscription = {
			u: {
				_id: mockUid,
				username: 'usernameMock',
				name: 'nameMock',
			},
			t: 'p',
			rid: 'roomId',
		};
		mockActionManager = undefined;
		mockE2EERoomState = 'READY';
		mockEmojiPicker = {
			open: fn<FunctionLike>(),
			isOpen: false,
			close: fn<FunctionLike>(),
		};

		(useUserId as Mock<FunctionLike>).mockReturnValue(mockUid);
		(useRoomSubscription as Mock<FunctionLike>).mockReturnValue(mockSubscription);
		(useUiKitActionManager as Mock<FunctionLike>).mockReturnValue(mockActionManager);
		(useE2EERoomState as Mock<FunctionLike>).mockReturnValue(mockE2EERoomState);
		(useEmojiPicker as Mock<FunctionLike>).mockReturnValue(mockEmojiPicker);
	});

	it('should initialize ChatMessages instance with correct arguments', () => {
		const { result } = renderHook(() =>
			useChatMessagesInstance({
				rid: mockSubscription.rid,
				tmid: 'threadId',
				encrypted: false,
			}),
		);

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);
	});

	it('should update ChatMessages subscription', () => {
		const { result, rerender } = renderHook(() =>
			useChatMessagesInstance({
				rid: mockSubscription.rid,
				tmid: 'threadId',
				encrypted: false,
			}),
		);

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);

		(useRoomSubscription as Mock<FunctionLike>).mockReturnValue({ ...mockSubscription, rid: 'newRoomId' });

		rerender();

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(2);
	});

	it('should update ChatMessages instance when dependencies changes', () => {
		const { result, rerender } = renderHook(() =>
			useChatMessagesInstance({
				rid: mockSubscription.rid,
				tmid: 'threadId',
				encrypted: false,
			}),
		);

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);

		(useE2EERoomState as Mock<FunctionLike>).mockReturnValue('WAITING_KEYS');

		rerender();

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(updateSubscriptionMock).toHaveBeenCalledTimes(2);
		expect(ChatMessages).toHaveBeenCalledTimes(2);
	});

	it('should update ChatMessages instance when hook props changes', () => {
		const initialProps = {
			rid: mockSubscription.rid,
			tmid: 'threadId',
			encrypted: false,
		};
		const { result, rerender } = renderHook((props = initialProps) => useChatMessagesInstance(props as any));

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);

		rerender({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			encrypted: true,
		});

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(2);
		expect(ChatMessages).toHaveBeenCalledTimes(2);
	});
});
