import { imperativeModal } from '@rocket.chat/ui-client';

import { formatTooLongMessageFileName, processTooLongMessage } from './processTooLongMessage';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import { getUser } from '../../user';
import type { ChatAPI } from '../ChatAPI';

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
	GenericModal: () => null,
}));

jest.mock('../../../../lib/i18n', () => ({
	t: (key: string) => key,
}));

jest.mock('../../settings', () => ({
	settings: {
		peek: jest.fn(),
	},
}));

jest.mock('../../toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('../../user', () => ({
	getUser: jest.fn(),
}));

const mockedSettingsPeek = jest.mocked(settings.peek);
const mockedDispatchToastMessage = jest.mocked(dispatchToastMessage);
const mockedImperativeModalOpen = jest.mocked(imperativeModal.open);
const mockedImperativeModalClose = jest.mocked(imperativeModal.close);
const mockedGetUser = jest.mocked(getUser);

describe('formatTooLongMessageFileName', () => {
	it('should format filename with given username and formatted date', () => {
		const fixedDate = new Date('2026-10-20T14:30:15');
		const fileName = formatTooLongMessageFileName('testuser', fixedDate);

		expect(fileName).toBe('testuser - 2026-10-20 14-30-15.txt');
	});

	it('should default to anonymous when username is undefined or empty', () => {
		const fixedDate = new Date('2026-10-20T14:30:15');

		expect(formatTooLongMessageFileName(undefined, fixedDate)).toBe('anonymous - 2026-10-20 14-30-15.txt');
		expect(formatTooLongMessageFileName('', fixedDate)).toBe('anonymous - 2026-10-20 14-30-15.txt');
	});

	it('should sanitize invalid filename characters in username', () => {
		const fixedDate = new Date('2026-10-20T14:30:15');
		const fileName = formatTooLongMessageFileName('user/test:name*<>?"|', fixedDate);

		expect(fileName).toBe('user_test_name______ - 2026-10-20 14-30-15.txt');
	});
});

describe('processTooLongMessage', () => {
	let mockChat: ChatAPI;

	beforeEach(() => {
		jest.clearAllMocks();

		mockChat = {
			currentEditingMessage: {
				getMID: jest.fn().mockReturnValue(undefined),
			},
			composer: {
				setText: jest.fn(),
				clear: jest.fn(),
			},
			flows: {
				uploadFiles: jest.fn().mockResolvedValue(undefined),
			},
		} as unknown as ChatAPI;

		mockedSettingsPeek.mockImplementation((key: string) => {
			if (key === 'Message_MaxAllowedSize') return 100;
			if (key === 'FileUpload_Enabled') return true;
			if (key === 'Message_AllowConvertLongMessagesToAttachment') return true;
			return undefined;
		});
	});

	it('should return false if message length does not exceed maxAllowedSize', async () => {
		const result = await processTooLongMessage(mockChat, { msg: 'short message' });

		expect(result).toBe(false);
		expect(mockedDispatchToastMessage).not.toHaveBeenCalled();
		expect(mockedImperativeModalOpen).not.toHaveBeenCalled();
	});

	it('should show error toast and keep message in composer if message is being edited', async () => {
		(mockChat.currentEditingMessage.getMID as jest.Mock).mockReturnValue('editing-mid');

		const msg = 'a'.repeat(150);
		const result = await processTooLongMessage(mockChat, { msg });

		expect(result).toBe(true);
		expect(mockedDispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			message: expect.any(Error),
		});
		expect(mockChat.composer?.setText).toHaveBeenCalledWith(msg);
		expect(mockedImperativeModalOpen).not.toHaveBeenCalled();
	});

	it('should show error toast if file uploads are disabled', async () => {
		mockedSettingsPeek.mockImplementation((key: string) => {
			if (key === 'Message_MaxAllowedSize') return 100;
			if (key === 'FileUpload_Enabled') return false;
			if (key === 'Message_AllowConvertLongMessagesToAttachment') return true;
			return undefined;
		});

		const msg = 'a'.repeat(150);
		const result = await processTooLongMessage(mockChat, { msg });

		expect(result).toBe(true);
		expect(mockedDispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			message: expect.any(Error),
		});
		expect(mockChat.composer?.setText).toHaveBeenCalledWith(msg);
	});

	it('should show error toast if converting long messages is disabled', async () => {
		mockedSettingsPeek.mockImplementation((key: string) => {
			if (key === 'Message_MaxAllowedSize') return 100;
			if (key === 'FileUpload_Enabled') return true;
			if (key === 'Message_AllowConvertLongMessagesToAttachment') return false;
			return undefined;
		});

		const msg = 'a'.repeat(150);
		const result = await processTooLongMessage(mockChat, { msg });

		expect(result).toBe(true);
		expect(mockedDispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			message: expect.any(Error),
		});
		expect(mockChat.composer?.setText).toHaveBeenCalledWith(msg);
	});

	it('should open confirmation modal and handle confirm by uploading file', async () => {
		mockedGetUser.mockReturnValue({ username: 'alice' } as any);

		let modalProps: any;
		mockedImperativeModalOpen.mockImplementation(({ props }: any): any => {
			modalProps = props;
			return { close: jest.fn(), cancel: jest.fn() };
		});

		const msg = 'a'.repeat(150);
		const promise = processTooLongMessage(mockChat, { msg });

		expect(mockedImperativeModalOpen).toHaveBeenCalledTimes(1);
		expect(modalProps.title).toBe('Message_too_long');
		expect(modalProps.variant).toBe('warning');

		// Trigger confirm
		await modalProps.onConfirm();
		const result = await promise;

		expect(result).toBe(true);
		expect(mockChat.composer?.clear).toHaveBeenCalledTimes(1);
		expect(mockedImperativeModalClose).toHaveBeenCalledTimes(1);
		expect(mockChat.flows.uploadFiles).toHaveBeenCalledWith({
			files: [
				expect.objectContaining({
					name: expect.stringMatching(/^alice - \d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}\.txt$/),
					type: 'text/plain',
				}),
			],
		});
	});

	it('should handle cancel/close without uploading', async () => {
		let modalProps: any;
		mockedImperativeModalOpen.mockImplementation(({ props }: any): any => {
			modalProps = props;
			return { close: jest.fn(), cancel: jest.fn() };
		});

		const msg = 'a'.repeat(150);
		const promise = processTooLongMessage(mockChat, { msg });

		expect(mockedImperativeModalOpen).toHaveBeenCalledTimes(1);

		// Trigger close
		modalProps.onClose();
		const result = await promise;

		expect(result).toBe(true);
		expect(mockedImperativeModalClose).toHaveBeenCalledTimes(1);
		expect(mockChat.flows.uploadFiles).not.toHaveBeenCalled();
	});
});
