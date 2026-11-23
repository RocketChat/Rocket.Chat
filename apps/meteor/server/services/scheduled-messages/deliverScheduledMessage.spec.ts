import type { IScheduledMessage } from '@rocket.chat/core-typings';
import type { IMessagesModel, IScheduledMessagesModel, IUploadsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { deliverScheduledMessage } from './deliverScheduledMessage';

const executeSendMessage = jest.fn();
const hasPermission = jest.fn();
const findOneById = jest.fn();
const sendFileMessage = jest.fn();
const canSendMessage = jest.fn();
const findUpload = jest.fn();
const removeFileAndText = jest.fn();

jest.mock('../../lib/authorization/hasPermission', () => ({
	hasPermissionAsync: (...args: unknown[]) => hasPermission(...args),
}));
jest.mock('../../meteor-methods/messages/sendFileMessage', () => ({
	sendFileMessage: (...args: unknown[]) => sendFileMessage(...args),
}));
jest.mock('../../lib/authorization/canSendMessage', () => ({
	canSendMessageAsync: (...args: unknown[]) => canSendMessage(...args),
}));
jest.mock('../../meteor-methods/messages/sendMessage', () => ({
	executeSendMessage: (...args: unknown[]) => executeSendMessage(...args),
}));

const item = {
	_id: 's1',
	rid: 'r1',
	u: { _id: 'u1' },
	msg: 'hi',
	status: 'sending',
} as IScheduledMessage;

describe('deliverScheduledMessage', () => {
	beforeAll(() => {
		registerModel('IUsersModel', { findOneById: (...args: unknown[]) => findOneById(...args) } as unknown as IUsersModel);
		registerModel('IUploadsModel', {
			findOneByIdAndUserIdAndRoomId: (...args: unknown[]) => findUpload(...args),
		} as unknown as IUploadsModel);
		registerModel('IScheduledMessagesModel', {
			removeFileAndTextById: (...args: unknown[]) => removeFileAndText(...args),
		} as unknown as IScheduledMessagesModel);
		registerModel('IMessagesModel', {
			getMessageByFileIdAndUsername: async (_fileId: string, userId: string) => (userId === 'u1' ? { _id: 'file-message' } : null),
		} as unknown as IMessagesModel);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		hasPermission.mockResolvedValue(true);
		findOneById.mockResolvedValue({ _id: 'u1', active: true, username: 'alice' });
		executeSendMessage.mockResolvedValue({ _id: 'm1' });
		removeFileAndText.mockResolvedValue({});
	});

	it('sends as the author when the author can still schedule', async () => {
		await expect(deliverScheduledMessage(item)).resolves.toEqual({ _id: 'm1' });
		expect(executeSendMessage).toHaveBeenCalledWith('u1', { rid: 'r1', msg: 'hi' });
	});

	it('posts each held file, with the text on the first one', async () => {
		findUpload.mockImplementation(async (_id: string) => ({ _id, name: 'stored' }));
		sendFileMessage.mockResolvedValue(true);
		const withFiles = {
			...item,
			msg: 'see attached',
			files: [
				{ _id: 'f1', name: 'a.png' },
				{ _id: 'f2', name: 'b.pdf', description: 'alt' },
			],
		};

		await expect(deliverScheduledMessage(withFiles)).resolves.toEqual({ _id: 'file-message' });

		expect(sendFileMessage.mock.calls).toEqual([
			['u1', { roomId: 'r1', file: expect.objectContaining({ _id: 'f1' }), msgData: { msg: 'see attached' } }],
			['u1', { roomId: 'r1', file: expect.objectContaining({ _id: 'f2', description: 'alt' }), msgData: { msg: '' } }],
		]);
		expect(canSendMessage).toHaveBeenCalledWith('r1', { uid: 'u1', username: 'alice', type: undefined });
		expect(executeSendMessage).not.toHaveBeenCalled();
	});

	it('drops each posted file from the item, so a retry after a failed file does not post the earlier ones again', async () => {
		findUpload.mockImplementation(async (_id: string) => ({ _id, name: 'stored' }));
		sendFileMessage.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('error-file-too-large'));
		const files = [
			{ _id: 'f1', name: 'a.png' },
			{ _id: 'f2', name: 'b.pdf' },
		];

		await expect(deliverScheduledMessage({ ...item, files })).rejects.toThrow('error-file-too-large');
		expect(removeFileAndText.mock.calls).toEqual([['s1', 'f1']]);
	});

	it('keeps the file on the item when the room refuses it', async () => {
		findUpload.mockImplementation(async (_id: string) => ({ _id, name: 'stored' }));
		sendFileMessage.mockResolvedValue(false);

		await expect(deliverScheduledMessage({ ...item, files: [{ _id: 'f1', name: 'a.png' }] })).rejects.toThrow('error-not-allowed');
		expect(removeFileAndText).not.toHaveBeenCalled();
	});

	it('reports a posted file it could not drop from the item as interrupted, so a plain retry does not post it again', async () => {
		findUpload.mockImplementation(async (_id: string) => ({ _id, name: 'stored' }));
		sendFileMessage.mockResolvedValue(true);
		removeFileAndText.mockRejectedValue(new Error('connection lost'));

		await expect(deliverScheduledMessage({ ...item, files: [{ _id: 'f1', name: 'a.png' }] })).rejects.toMatchObject({
			error: 'error-scheduled-message-interrupted',
		});
	});

	it('does not post when a held file is gone', async () => {
		findUpload.mockResolvedValue(null);

		await expect(deliverScheduledMessage({ ...item, files: [{ _id: 'f1', name: 'a.png' }] })).rejects.toThrow(
			'error-scheduled-message-file-missing',
		);
		expect(sendFileMessage).not.toHaveBeenCalled();
	});

	it('does not send after the author lost the schedule-message permission', async () => {
		hasPermission.mockResolvedValue(false);

		await expect(deliverScheduledMessage(item)).rejects.toThrow('error-not-allowed');
		expect(hasPermission).toHaveBeenCalledWith('u1', 'schedule-message', 'r1');
		expect(executeSendMessage).not.toHaveBeenCalled();
	});

	it('does not send for a deactivated author', async () => {
		findOneById.mockResolvedValue({ _id: 'u1', active: false });

		await expect(deliverScheduledMessage(item)).rejects.toThrow('error-invalid-user');
		expect(executeSendMessage).not.toHaveBeenCalled();
	});
});
