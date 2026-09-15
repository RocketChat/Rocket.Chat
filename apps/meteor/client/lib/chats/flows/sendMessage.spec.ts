import { processMessageEditing } from './processMessageEditing';
import { processMessageUploads } from './processMessageUploads';
import { processSetReaction } from './processSetReaction';
import { processSlashCommand } from './processSlashCommand';
import { processTooLongMessage } from './processTooLongMessage';
import { sendMessage } from './sendMessage';
import { runOptimisticSendMessage } from '../../../../app/lib/client/methods/sendMessage';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { onClientBeforeSendMessage } from '../../onClientBeforeSendMessage';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

jest.mock('../../../../app/lib/client/methods/sendMessage', () => ({ runOptimisticSendMessage: jest.fn() }));
jest.mock('../../../../app/utils/client/lib/SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));
jest.mock('../../onClientBeforeSendMessage', () => ({ onClientBeforeSendMessage: jest.fn() }));
jest.mock('../../toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('./afterSendMessageCallback', () => ({ afterSendMessageCallback: jest.fn() }));
jest.mock('./processMessageEditing', () => ({ processMessageEditing: jest.fn() }));
jest.mock('./processMessageUploads', () => ({ processMessageUploads: jest.fn() }));
jest.mock('./processSetReaction', () => ({ processSetReaction: jest.fn() }));
jest.mock('./processSlashCommand', () => ({ processSlashCommand: jest.fn() }));
jest.mock('./processTooLongMessage', () => ({ processTooLongMessage: jest.fn() }));

const mockedPost = jest.mocked(sdk.rest.post);
const mockedRunOptimisticSendMessage = jest.mocked(runOptimisticSendMessage);
const mockedOnClientBeforeSendMessage = jest.mocked(onClientBeforeSendMessage);
const mockedDispatchToastMessage = jest.mocked(dispatchToastMessage);
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
		const [optimisticOrder] = mockedRunOptimisticSendMessage.mock.invocationCallOrder;
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
