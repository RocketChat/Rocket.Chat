import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock, MockedFunction } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../../tests/mocks/moduleScope';

let isE2EEMessage: (typeof import('@rocket.chat/core-typings'))['isE2EEMessage'];
let useDecryptedMessage: (typeof import('./useDecryptedMessage'))['useDecryptedMessage'];
let e2e: (typeof import('../../../../../lib/e2ee/rocketchat.e2e'))['e2e'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

describe('useDecryptedMessage', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/core-typings'), {
			exports: {
				isE2EEMessage: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../../lib/e2ee/rocketchat.e2e', {
			exports: {
				e2e: {
					decryptMessage: fn<FunctionLike>(),
				},
			},
		});
		mock.module(require.resolve('react-i18next'), {
			exports: {
				useTranslation: () => ({
					t: (key: string) => key,
				}),
			},
		});
		({ isE2EEMessage } = require('@rocket.chat/core-typings'));
		({ useDecryptedMessage } = require('./useDecryptedMessage'));
		({ e2e } = require('../../../../../lib/e2ee/rocketchat.e2e'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	it('should return the original message for non-E2EE messages', () => {
		(isE2EEMessage as MockedFunction<typeof isE2EEMessage>).mockReturnValue(false);
		const message: any = { msg: 'Hello, world!' };

		const { result } = renderHook(() => useDecryptedMessage(message));

		expect(result.current).toBe('Hello, world!');
		expect(e2e.decryptMessage).not.toHaveBeenCalled();
	});

	it('should return decrypted message for E2EE messages', async () => {
		(isE2EEMessage as MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);
		(e2e.decryptMessage as Mock<FunctionLike>).mockResolvedValue({ msg: 'Decrypted message' });
		const message: any = { msg: 'Encrypted message' };
		const { result } = renderHook(() => useDecryptedMessage(message));

		await waitFor(() => {
			expect(result.current).not.toBe('E2E_message_encrypted_placeholder');
		});

		expect(result.current).toBe('Decrypted message');
		expect(e2e.decryptMessage).toHaveBeenCalledWith(message);
	});

	it('should handle E2EE messages with attachments', async () => {
		(isE2EEMessage as MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);
		(e2e.decryptMessage as Mock<FunctionLike>).mockResolvedValue({
			attachments: [{ description: 'Attachment description' }],
		});
		const message: any = { msg: 'Encrypted message with attachment' };

		const { result } = renderHook(() => useDecryptedMessage(message));

		await waitFor(() => {
			expect(result.current).toBe('Attachment description');
		});

		expect(result.current).toBe('Attachment description');
		expect(e2e.decryptMessage).toHaveBeenCalledWith(message);
	});

	it('should handle E2EE messages with attachments but no description', async () => {
		(isE2EEMessage as MockedFunction<typeof isE2EEMessage>).mockReturnValue(true);
		(e2e.decryptMessage as Mock<FunctionLike>).mockResolvedValue({
			attachments: [{}],
		});
		const message: any = { msg: 'Encrypted message with attachment' };

		const { result } = renderHook(() => useDecryptedMessage(message));

		await waitFor(() => {
			expect(result.current).toBe('E2E_message_encrypted_placeholder');
		});

		await waitFor(() => {
			expect(result.current).toBe('Message_with_attachment');
		});

		expect(e2e.decryptMessage).toHaveBeenCalledWith(message);
	});
});
