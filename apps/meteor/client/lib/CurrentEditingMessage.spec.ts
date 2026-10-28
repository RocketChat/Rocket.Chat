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
				setEditingMode: jest.fn(),
			},
			data: {
				discardDraft: jest.fn().mockResolvedValue(undefined),
				findMessageByID: jest.fn(),
			},
		} as unknown as ChatAPI;

		return { chat, currentEditingMessage: new CurrentEditingMessage(chat) };
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('exits edit mode after the edited message is deleted without looking it up again', async () => {
		const { chat, currentEditingMessage } = createChat();
		currentEditingMessage.setMID('message-id');

		await currentEditingMessage.stopAfterDeletion();

		expect(chat.data.discardDraft).toHaveBeenCalledWith('message-id');
		expect(chat.data.findMessageByID).not.toHaveBeenCalled();
		expect(chat.composer?.setEditingMode).toHaveBeenCalledWith(false);
		expect(currentEditingMessage.getMID()).toBeUndefined();
		expect(clearHighlightMessageMock).toHaveBeenCalledTimes(1);
	});

	it('does nothing when no message is being edited', async () => {
		const { chat, currentEditingMessage } = createChat();

		await currentEditingMessage.stopAfterDeletion();

		expect(chat.data.discardDraft).not.toHaveBeenCalled();
		expect(chat.composer?.setEditingMode).not.toHaveBeenCalled();
		expect(clearHighlightMessageMock).not.toHaveBeenCalled();
	});
});
