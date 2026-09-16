import type { IUser } from '@rocket.chat/core-typings';

import { processMessageEditing } from './processMessageEditing';
import { processMessageUploads } from './processMessageUploads';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';
import { sendMessage } from './sendMessage';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { Messages, Rooms } from '../../../stores';
import { sdk } from '../../SDKClient';
import { onClientBeforeSendMessage } from '../../onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../onClientMessageReceived';
import { dispatchToastMessage } from '../../toast';
import { getUser, getUserId } from '../../user';
import type { ChatAPI } from '../ChatAPI';

jest.mock('../../SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));
jest.mock('../../onClientBeforeSendMessage', () => ({ onClientBeforeSendMessage: jest.fn() }));
jest.mock('../../onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn() }));
jest.mock('../../toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../user', () => ({ getUser: jest.fn(), getUserId: jest.fn() }));
jest.mock('../../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../../utils/threadMessageUtils', () => ({ upsertThreadMessageInCache: jest.fn() }));
jest.mock('../../../stores', () => ({
	Messages: { state: { get: jest.fn(), store: jest.fn(), update: jest.fn() } },
	Rooms: { state: { get: jest.fn() } },
}));
jest.mock('./afterSendMessageCallback', () => ({ afterSendMessageCallback: jest.fn() }));
jest.mock('./processMessageEditing', () => ({ processMessageEditing: jest.fn() }));
jest.mock('./processMessageUploads', () => ({ processMessageUploads: jest.fn() }));
jest.mock('./processSetReaction', () => ({ processSetReaction: jest.fn() }));
jest.mock('./processSlashCommand', () => ({ processSlashCommand: jest.fn() }));
jest.mock('./processTooLongMessage', () => ({ processTooLongMessage: jest.fn() }));

const mockedPost = jest.mocked(sdk.rest.post);
const mockedOnClientBeforeSendMessage = jest.mocked(onClientBeforeSendMessage);
const mockedOnClientMessageReceived = jest.mocked(onClientMessageReceived);
const mockedDispatchToastMessage = jest.mocked(dispatchToastMessage);
const mockedGetUser = jest.mocked(getUser);
const mockedGetUserId = jest.mocked(getUserId);
const mockedStoreMessage = jest.mocked(Messages.state.store);
const mockedGetMessage = jest.mocked(Messages.state.get);
const mockedGetRoom = jest.mocked(Rooms.state.get);
const mockedProcessSetReaction = jest.mocked(processSetReaction);
const mockedProcessTooLongMessage = jest.mocked(processTooLongMessage);
const mockedProcessSlashCommand = jest.mocked(processSlashCommand);
const mockedProcessMessageUploads = jest.mocked(processMessageUploads);
const mockedProcessMessageEditing = jest.mocked(processMessageEditing);

const createChat = () => {
	const clear = jest.fn();

	const chat = {
		composer: {
			clear,
			dismissAllQuotedMessages: jest.fn(),
			uploads: { get: () => [] },
			quotedMessages: { get: () => [] },
		},
		currentEditingMessage: { getMID: () => undefined },
		readStateManager: { clearUnreadMark: jest.fn() },
		data: {
			isSubscribedToRoom: jest.fn().mockResolvedValue(true),
			joinRoom: jest.fn(),
			composeMessage: jest.fn().mockResolvedValue(createFakeMessage({ msg: 'hello' })),
			findMessageByID: jest.fn(),
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
	jest.clearAllMocks();
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
