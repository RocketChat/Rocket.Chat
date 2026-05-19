import { isE2EEMessage } from '@rocket.chat/core-typings';
import { renderHook, waitFor } from '@testing-library/react';

import { useDecryptedMessage } from './useDecryptedMessage';
import { e2e } from '../lib/e2ee/rocketchat.e2e';

// Mock the dependencies
jest.mock('@rocket.chat/core-typings', () => ({
	isE2EEMessage: jest.fn(),
}));

jest.mock('../lib/e2ee/rocketchat.e2e', () => ({
	e2e: {
		decryptMessage: jest.fn(),
	},
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

describe('useDecryptedMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return the original message for non-E2EE messages', () => {
		(isE2EEMessage as jest.MockedFunction<typeof isE2EEMessage>).mockReturnValue(false);
		const message = { msg: 'Hello, world!' };

		const { result } = renderHook(() => useDecryptedMessage(message as any));

		expect(result.current).toBe('Hello, world!');
		expect(e2e.decryptMessage).not.toHaveBeenCalled();
	});

	it('should return decrypted message for E2EE messages', async () => {
		(isE2EEMessage as jest.MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);
		(e2e.decryptMessage as jest.Mock).mockResolvedValue({ msg: 'Decrypted message' });
		const message = { msg: 'Encrypted message' };
		const { result } = renderHook(() => useDecryptedMessage(message as any));

		await waitFor(() => {
			expect(result.current).not.toBe('E2E_message_encrypted_placeholder');
		});

		expect(result.current).toBe('Decrypted message');
		expect(e2e.decryptMessage).toHaveBeenCalledWith(message);
	});

	it('should handle E2EE messages with attachments', async () => {
		(isE2EEMessage as jest.MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);
		(e2e.decryptMessage as jest.Mock).mockResolvedValue({
			attachments: [{ title: 'Attachment title' }],
		});
		const message = { msg: 'Encrypted message with attachment' };

		const { result } = renderHook(() => useDecryptedMessage(message as any));

		await waitFor(() => {
			expect(result.current).toBe('E2E_message_encrypted_placeholder');
		});

		expect(e2e.decryptMessage).toHaveBeenCalledWith(message);
	});

	it('should handle E2EE messages with attachments but no description', async () => {
		(isE2EEMessage as jest.MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);
		(e2e.decryptMessage as jest.Mock).mockResolvedValue({
			attachments: [{}],
		});
		const message = { msg: 'Encrypted message with attachment' };

		const { result } = renderHook(() => useDecryptedMessage(message as any));

		await waitFor(() => {
			expect(result.current).toBe('E2E_message_encrypted_placeholder');
		});

		await waitFor(() => {
			expect(result.current).toBe('Message_with_attachment');
		});

		expect(e2e.decryptMessage).toHaveBeenCalledWith(message);
	});

	it('should ignore a stale decryption when the message prop changes mid-flight', async () => {
		(isE2EEMessage as jest.MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);

		let resolveFirst: (value: unknown) => void = () => undefined;
		const firstDecryption = new Promise((resolve) => {
			resolveFirst = resolve;
		});

		(e2e.decryptMessage as jest.Mock)
			.mockReturnValueOnce(firstDecryption)
			.mockResolvedValueOnce({ msg: 'Second decrypted' });

		const messageA = { msg: 'A' };
		const messageB = { msg: 'B' };

		const { result, rerender } = renderHook((msg: any) => useDecryptedMessage(msg), { initialProps: messageA });

		rerender(messageB);

		await waitFor(() => {
			expect(result.current).toBe('Second decrypted');
		});

		resolveFirst({ msg: 'First decrypted (stale)' });

		await new Promise((r) => setTimeout(r, 0));

		expect(result.current).toBe('Second decrypted');
	});
});
