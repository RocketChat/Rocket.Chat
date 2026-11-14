import { CurrentEditingMessage } from './CurrentEditingMessage';
import type { ChatAPI } from './chats/ChatAPI';
import { clearHighlightMessage } from '../views/room/MessageList/providers/messageHighlightSubscription';

jest.mock('../views/room/MessageList/providers/messageHighlightSubscription', () => ({
	clearHighlightMessage: jest.fn(),
}));

const makeChat = (
	message: { _id: string; msg: string } | null = { _id: 'message-id', msg: 'Original message' },
	composerAvailable = true,
) => {
	const composer = {
		text: '',
		clear: jest.fn(),
		setText: jest.fn(),
		setEditingMode: jest.fn(),
	};
	const data = {
		findMessageByID: jest.fn().mockResolvedValue(message),
		discardDraft: jest.fn().mockResolvedValue(undefined),
		getDraft: jest.fn().mockResolvedValue(undefined),
		saveDraft: jest.fn().mockResolvedValue(undefined),
	};
	return { chat: { composer: composerAvailable ? composer : undefined, data } as unknown as ChatAPI, composer, data };
};

describe('CurrentEditingMessage', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('restores the room draft and clears editing state without looking up the deleted message', async () => {
		const { chat, composer, data } = makeChat(null);
		const editingMessage = new CurrentEditingMessage(chat);
		data.getDraft.mockResolvedValue('unsent room draft');
		editingMessage.setMID('message-id');

		await editingMessage.stop({ messageDeleted: true });

		expect(data.findMessageByID).not.toHaveBeenCalled();
		expect(data.getDraft).toHaveBeenCalledWith(undefined);
		expect(data.discardDraft).toHaveBeenCalledWith('message-id');
		expect(data.getDraft.mock.invocationCallOrder[0]).toBeLessThan(data.discardDraft.mock.invocationCallOrder[0]);
		expect(composer.clear).toHaveBeenCalledTimes(1);
		expect(composer.setText).toHaveBeenCalledWith('unsent room draft');
		expect(composer.setEditingMode).toHaveBeenCalledWith(false);
		expect(editingMessage.getMID()).toBeUndefined();
		expect(clearHighlightMessage).toHaveBeenCalledTimes(1);
	});

	it('preserves normal stop draft handling', async () => {
		const { chat, composer, data } = makeChat({ _id: 'message-id', msg: 'Original message' });
		const editingMessage = new CurrentEditingMessage(chat);
		composer.text = 'Edited draft';
		editingMessage.setMID('message-id');

		await editingMessage.stop();

		expect(data.findMessageByID).toHaveBeenCalledWith('message-id');
		expect(data.saveDraft).toHaveBeenCalledWith('message-id', 'Edited draft');
		expect(composer.setEditingMode).toHaveBeenCalledWith(false);
		expect(editingMessage.getMID()).toBeUndefined();
	});

	it('clears deleted-message state if the composer has already been released', async () => {
		const { chat, data } = makeChat(null, false);
		const editingMessage = new CurrentEditingMessage(chat);
		editingMessage.setMID('message-id');

		await editingMessage.stop({ messageDeleted: true });

		expect(data.findMessageByID).not.toHaveBeenCalled();
		expect(data.discardDraft).toHaveBeenCalledWith('message-id');
		expect(editingMessage.getMID()).toBeUndefined();
		expect(clearHighlightMessage).toHaveBeenCalledTimes(1);
	});

	it('clears deleted-message state and propagates a draft discard failure', async () => {
		const { chat, composer, data } = makeChat(null);
		const editingMessage = new CurrentEditingMessage(chat);
		const error = new Error('Draft discard failed');
		data.getDraft.mockResolvedValue('unsent room draft');
		data.discardDraft.mockRejectedValue(error);
		editingMessage.setMID('message-id');

		await expect(editingMessage.stop({ messageDeleted: true })).rejects.toBe(error);

		expect(composer.clear).toHaveBeenCalledTimes(1);
		expect(composer.setText).toHaveBeenCalledWith('unsent room draft');
		expect(composer.setEditingMode).toHaveBeenCalledWith(false);
		expect(editingMessage.getMID()).toBeUndefined();
		expect(clearHighlightMessage).toHaveBeenCalledTimes(1);
	});

	it('attempts to discard the edit draft and clears state when the room draft lookup fails', async () => {
		const { chat, composer, data } = makeChat(null);
		const editingMessage = new CurrentEditingMessage(chat);
		const error = new Error('Room draft lookup failed');
		data.getDraft.mockRejectedValue(error);
		editingMessage.setMID('message-id');

		await expect(editingMessage.stop({ messageDeleted: true })).rejects.toBe(error);

		expect(data.findMessageByID).not.toHaveBeenCalled();
		expect(data.getDraft).toHaveBeenCalledWith(undefined);
		expect(data.discardDraft).toHaveBeenCalledWith('message-id');
		expect(composer.clear).toHaveBeenCalledTimes(1);
		expect(composer.setText).toHaveBeenCalledWith('');
		expect(composer.setEditingMode).toHaveBeenCalledWith(false);
		expect(editingMessage.getMID()).toBeUndefined();
		expect(clearHighlightMessage).toHaveBeenCalledTimes(1);
	});
});
