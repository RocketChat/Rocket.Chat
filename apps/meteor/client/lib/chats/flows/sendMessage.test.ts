import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeMessage } from '../../../../tests/mocks/data';
import type { ChatAPI } from '../ChatAPI';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('../../SDKClient', {
	exports: {
		sdk: { rest: { post: fn<FunctionLike>() } },
	},
});
mock.module('../../onClientBeforeSendMessage', {
	exports: {
		onClientBeforeSendMessage: fn<FunctionLike>(),
	},
});
mock.module('../../onClientMessageReceived', {
	exports: {
		onClientMessageReceived: fn<FunctionLike>(),
	},
});
mock.module('../../toast', {
	exports: {
		dispatchToastMessage: fn<FunctionLike>(),
	},
});
mock.module('../../user', {
	exports: {
		getUser: fn<FunctionLike>(),
		getUserId: fn<FunctionLike>(),
	},
});
mock.module('../../settings', {
	exports: {
		settings: { peek: fn<FunctionLike>() },
	},
});
mock.module('../../utils/threadMessageUtils', {
	exports: {
		upsertThreadMessageInCache: fn<FunctionLike>(),
	},
});
mock.module('../../../stores', {
	exports: {
		Messages: { state: { get: fn<FunctionLike>(), store: fn<FunctionLike>(), update: fn<FunctionLike>() } },
		Rooms: { state: { get: fn<FunctionLike>() } },
	},
});
mock.module('./afterSendMessageCallback', {
	exports: {
		afterSendMessageCallback: fn<FunctionLike>(),
	},
});
mock.module('./processMessageEditing', {
	exports: {
		processMessageEditing: fn<FunctionLike>(),
	},
});
mock.module('./processMessageUploads', {
	exports: {
		processMessageUploads: fn<FunctionLike>(),
	},
});
mock.module('./processSetReaction', {
	exports: {
		processSetReaction: fn<FunctionLike>(),
	},
});
mock.module('./processSlashCommand', {
	exports: {
		processSlashCommand: fn<FunctionLike>(),
	},
});
mock.module('./processTooLongMessage', {
	exports: {
		processTooLongMessage: fn<FunctionLike>(),
	},
});
const { processMessageEditing }: typeof import('./processMessageEditing') = require('./processMessageEditing');
const { processMessageUploads }: typeof import('./processMessageUploads') = require('./processMessageUploads');
const { processSetReaction }: typeof import('./processSetReaction') = require('./processSetReaction');
const { processSlashCommand }: typeof import('./processSlashCommand') = require('./processSlashCommand');
const { processTooLongMessage }: typeof import('./processTooLongMessage') = require('./processTooLongMessage');
const { sendMessage }: typeof import('./sendMessage') = require('./sendMessage');
const { Messages, Rooms }: typeof import('../../../stores') = require('../../../stores');
const { sdk }: typeof import('../../SDKClient') = require('../../SDKClient');
const { onClientBeforeSendMessage }: typeof import('../../onClientBeforeSendMessage') = require('../../onClientBeforeSendMessage');
const { onClientMessageReceived }: typeof import('../../onClientMessageReceived') = require('../../onClientMessageReceived');
const { dispatchToastMessage }: typeof import('../../toast') = require('../../toast');
const { getUser, getUserId }: typeof import('../../user') = require('../../user');

const mockedPost = mocked(sdk.rest.post);
const mockedOnClientBeforeSendMessage = mocked(onClientBeforeSendMessage);
const mockedOnClientMessageReceived = mocked(onClientMessageReceived);
const mockedDispatchToastMessage = mocked(dispatchToastMessage);
const mockedGetUser = mocked(getUser);
const mockedGetUserId = mocked(getUserId);
const mockedStoreMessage = mocked(Messages.state.store);
const mockedGetMessage = mocked(Messages.state.get);
const mockedGetRoom = mocked(Rooms.state.get);
const mockedProcessSetReaction = mocked(processSetReaction);
const mockedProcessTooLongMessage = mocked(processTooLongMessage);
const mockedProcessSlashCommand = mocked(processSlashCommand);
const mockedProcessMessageUploads = mocked(processMessageUploads);
const mockedProcessMessageEditing = mocked(processMessageEditing);

const createChat = () => {
	const clear = fn<FunctionLike>();

	const chat = {
		composer: {
			clear,
			dismissAllQuotedMessages: fn<FunctionLike>(),
			uploads: { get: () => [] },
			quotedMessages: { get: () => [] },
		},
		currentEditingMessage: { getMID: () => undefined },
		readStateManager: { clearUnreadMark: fn<FunctionLike>() },
		data: {
			isSubscribedToRoom: fn<FunctionLike>().mockResolvedValue(true),
			joinRoom: fn<FunctionLike>(),
			composeMessage: fn<FunctionLike>().mockResolvedValue(createFakeMessage({ msg: 'hello' })),
			findMessageByID: fn<FunctionLike>(),
		},
	} as unknown as ChatAPI;

	return { chat, clear };
};

beforeEach(() => {
	mockedProcessSetReaction.mockResolvedValue(false);
	mockedProcessTooLongMessage.mockResolvedValue(false);
	mockedProcessSlashCommand.mockResolvedValue(false);
	mockedProcessMessageUploads.mockResolvedValue(false);
	mockedProcessMessageEditing.mockResolvedValue(false);
	mockedOnClientBeforeSendMessage.mockImplementation(async (message) => message);
	mockedOnClientMessageReceived.mockImplementation(async (message) => message);
	mockedGetUserId.mockReturnValue('john.doe');
	mockedGetUser.mockReturnValue({ _id: 'john.doe', username: 'john.doe', name: 'John Doe' } as IUser);
	mockedGetMessage.mockReturnValue(undefined);
	mockedGetRoom.mockReturnValue(undefined);
});

afterEach(() => {
	mocker.clearAllMocks();
});

// The realtime composer relies on the flows owning the clear: it reads the text and hands it to
// `onSend` without emptying the box itself, so a send that fails before committing must leave the
// composer untouched for the user to retry.
describe('sendMessage', () => {
	it('should clear the composer once the message is committed, before the optimistic insert and the request', async () => {
		const { chat, clear } = createChat();

		await sendMessage(chat, { text: 'hello' });

		expect(clear).toHaveBeenCalledTimes(1);

		const [clearOrder] = clear.mock.invocationCallOrder;
		const [optimisticOrder] = mockedStoreMessage.mock.invocationCallOrder;
		const [postOrder] = mockedPost.mock.invocationCallOrder;

		expect(clearOrder).toBeLessThan(optimisticOrder);
		expect(optimisticOrder).toBeLessThan(postOrder);
	});

	it('should clear the composer on the upload path', async () => {
		const { chat, clear } = createChat();
		mockedProcessMessageUploads.mockResolvedValue(true);

		await sendMessage(chat, { text: 'hello' });

		expect(clear).toHaveBeenCalledTimes(1);
		expect(mockedPost).not.toHaveBeenCalled();
	});

	it('should leave the composer intact when the flow fails before committing', async () => {
		const { chat, clear } = createChat();
		mockedOnClientBeforeSendMessage.mockRejectedValue(new Error('encryption failed'));

		await sendMessage(chat, { text: 'hello' });

		expect(clear).not.toHaveBeenCalled();
		expect(mockedPost).not.toHaveBeenCalled();
		expect(mockedDispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: expect.any(Error) });
	});

	it('should leave the composer to the sub-flow that owns it', async () => {
		const { chat, clear } = createChat();
		mockedProcessSlashCommand.mockResolvedValue(true);

		await sendMessage(chat, { text: '/help', isSlashCommandAllowed: true });

		expect(clear).not.toHaveBeenCalled();
		expect(mockedPost).not.toHaveBeenCalled();
	});
});
