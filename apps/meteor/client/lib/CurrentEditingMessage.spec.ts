import { CurrentEditingMessage } from './CurrentEditingMessage';
import type { ChatAPI } from './chats/ChatAPI';
import { clearHighlightMessage } from '../views/room/MessageList/providers/messageHighlightSubscription';

jest.mock('../views/room/MessageList/providers/messageHighlightSubscription', () => ({
	clearHighlightMessage: jest.fn(),
}));

const clearHighlightMessageMock = jest.mocked(clearHighlightMessage);

describe('CurrentEditingMessage', () => {
	const createChat = () => {
		const chat = {
			composer: {
				setText: jest.fn(),
				setEditingMode: jest.fn(),
			},
			data: {
				discardDraft: jest.fn().mockResolvedValue(undefined),
				getDraft: jest.fn().mockResolvedValue('normal draft'),
				findMessageByID: jest.fn(),
			},
		} as unknown as ChatAPI;

		return { chat, currentEditingMessage: new CurrentEditingMessage(chat) };
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('exits edit mode after the edited message is deleted and restores the normal draft', async () => {
		const { chat, currentEditingMessage } = createChat();
		currentEditingMessage.setMID('message-id');

		await currentEditingMessage.stopAfterDeletion('message-id');

		expect(chat.data.discardDraft).toHaveBeenCalledWith('message-id');
		expect(chat.data.findMessageByID).not.toHaveBeenCalled();
		expect(chat.data.getDraft).toHaveBeenCalledWith(undefined);
		expect(chat.composer?.setText).toHaveBeenCalledWith('normal draft');
		expect(chat.composer?.setEditingMode).toHaveBeenCalledWith(false);
		expect(currentEditingMessage.getMID()).toBeUndefined();
		expect(clearHighlightMessageMock).toHaveBeenCalledTimes(1);
	});

	it('does nothing when no message is being edited', async () => {
		const { chat, currentEditingMessage } = createChat();

		await currentEditingMessage.stopAfterDeletion('message-id');

		expect(chat.data.discardDraft).not.toHaveBeenCalled();
		expect(chat.data.getDraft).not.toHaveBeenCalled();
		expect(chat.composer?.setText).not.toHaveBeenCalled();
		expect(chat.composer?.setEditingMode).not.toHaveBeenCalled();
		expect(clearHighlightMessageMock).not.toHaveBeenCalled();
	});

	it('does not clear a different edit if the deleted message is no longer being edited', async () => {
		const { chat, currentEditingMessage } = createChat();
		currentEditingMessage.setMID('another-message-id');

		await currentEditingMessage.stopAfterDeletion('message-id');

		expect(chat.data.discardDraft).not.toHaveBeenCalled();
		expect(chat.data.getDraft).not.toHaveBeenCalled();
		expect(chat.composer?.setText).not.toHaveBeenCalled();
		expect(chat.composer?.setEditingMode).not.toHaveBeenCalled();
		expect(currentEditingMessage.getMID()).toBe('another-message-id');
		expect(clearHighlightMessageMock).not.toHaveBeenCalled();
	});

	it('does not clear a new edit started while restoring the normal draft', async () => {
		const { chat, currentEditingMessage } = createChat();
		currentEditingMessage.setMID('message-id');
		jest.mocked(chat.data.getDraft).mockImplementation(async () => {
			currentEditingMessage.setMID('another-message-id');
			return 'normal draft';
		});

		await currentEditingMessage.stopAfterDeletion('message-id');

		expect(chat.data.discardDraft).toHaveBeenCalledWith('message-id');
		expect(chat.composer?.setText).not.toHaveBeenCalled();
		expect(chat.composer?.setEditingMode).not.toHaveBeenCalled();
		expect(currentEditingMessage.getMID()).toBe('another-message-id');
		expect(clearHighlightMessageMock).not.toHaveBeenCalled();
	});
});
