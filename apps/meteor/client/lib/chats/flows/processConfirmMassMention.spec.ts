import type { ChatAPI } from '../ChatAPI';
import { processConfirmMassMention } from './processConfirmMassMention';
import { settings } from '../../settings';
import { imperativeModal } from '@rocket.chat/ui-client';

jest.mock('../../settings', () => ({
	settings: {
		peek: jest.fn(),
	},
}));

jest.mock('@rocket.chat/ui-client', () => ({
	GenericModal: () => null,
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
}));

jest.mock('../../../../app/utils/lib/i18n', () => ({
	t: jest.fn((key) => key),
}));

describe('processConfirmMassMention', () => {
	let mockChat: jest.Mocked<ChatAPI>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockChat = {
			data: {
				getRoom: jest.fn().mockResolvedValue({ usersCount: 15 }),
			},
		} as unknown as jest.Mocked<ChatAPI>;
	});

	it('should return false if Message_ConfirmAll is false', async () => {
		(settings.peek as jest.Mock).mockReturnValue(false);

		const result = await processConfirmMassMention(mockChat, { msg: 'Hello @all' });

		expect(result).toBe(false);
		expect(mockChat.data.getRoom).not.toHaveBeenCalled();
	});

	it('should return false if message does not contain @all or @here', async () => {
		(settings.peek as jest.Mock).mockReturnValue(true);

		const result = await processConfirmMassMention(mockChat, { msg: 'Hello world' });

		expect(result).toBe(false);
		expect(mockChat.data.getRoom).not.toHaveBeenCalled();
	});

	it('should return false if room has fewer users than minMembers', async () => {
		(settings.peek as jest.Mock).mockImplementation((key) => {
			if (key === 'Message_ConfirmAll') return true;
			if (key === 'Message_ConfirmAll_MinMembers') return 20;
		});

		const result = await processConfirmMassMention(mockChat, { msg: 'Hello @all' });

		expect(result).toBe(false);
		expect(mockChat.data.getRoom).toHaveBeenCalled();
	});

	it('should return false if chat.data.getRoom rejects', async () => {
		(settings.peek as jest.Mock).mockImplementation((key) => {
			if (key === 'Message_ConfirmAll') return true;
			if (key === 'Message_ConfirmAll_MinMembers') return 10;
		});
		mockChat.data.getRoom = jest.fn().mockRejectedValue(new Error('Network error'));

		const result = await processConfirmMassMention(mockChat, { msg: 'Hello @all' });

		expect(result).toBe(false);
	});

	it('should open modal and resolve false on confirm', async () => {
		(settings.peek as jest.Mock).mockImplementation((key) => {
			if (key === 'Message_ConfirmAll') return true;
			if (key === 'Message_ConfirmAll_MinMembers') return 10;
		});

		(imperativeModal.open as jest.Mock).mockImplementation((options) => {
			options.props.onConfirm();
		});

		const result = await processConfirmMassMention(mockChat, { msg: 'Hello @all' });

		expect(imperativeModal.open).toHaveBeenCalled();
		expect(imperativeModal.close).toHaveBeenCalled();
		expect(result).toBe(false);
	});

	it('should open modal and resolve true on close/cancel', async () => {
		(settings.peek as jest.Mock).mockImplementation((key) => {
			if (key === 'Message_ConfirmAll') return true;
			if (key === 'Message_ConfirmAll_MinMembers') return 10;
		});

		(imperativeModal.open as jest.Mock).mockImplementation((options) => {
			options.props.onClose();
		});

		const result = await processConfirmMassMention(mockChat, { msg: 'Hello @here' });

		expect(imperativeModal.open).toHaveBeenCalled();
		expect(imperativeModal.close).toHaveBeenCalled();
		expect(result).toBe(true);
	});
});
