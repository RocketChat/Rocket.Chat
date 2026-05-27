import { imperativeModal } from '@rocket.chat/ui-client';

import * as banners from '../banners';
import { e2e } from './rocketchat.e2e';
import { dispatchToastMessage } from '../toast';

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
}));

jest.mock('../../../app/utils/client', () => ({
	getUserAvatarURL: jest.fn(),
}));

jest.mock('../../../app/utils/lib/i18n', () => ({
	t: (key: string) => key,
}));

jest.mock('../toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('../banners', () => ({
	closeById: jest.fn(),
	open: jest.fn(),
}));

describe('E2E password modal', () => {
	const getModalProps = () => (imperativeModal.open as jest.Mock).mock.calls.at(-1)?.[0].props;

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('keeps the E2EE alert open when the modal header close button is used', () => {
		e2e.openEnterE2EEPasswordModal(jest.fn());

		getModalProps().onClose();

		expect(imperativeModal.close).toHaveBeenCalledTimes(1);
		expect(banners.closeById).not.toHaveBeenCalled();
	});

	it('dismisses the E2EE alert when the user explicitly cancels entering the password', () => {
		e2e.openEnterE2EEPasswordModal(jest.fn());

		getModalProps().onCancel();

		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'info', message: 'End_To_End_Encryption_Not_Enabled' });
		expect(imperativeModal.close).toHaveBeenCalledTimes(1);
		expect(banners.closeById).toHaveBeenCalledWith('e2e');
	});

	it('dismisses the E2EE alert after the password is entered successfully', async () => {
		const onEnterE2EEPassword = jest.fn().mockResolvedValue(undefined);

		e2e.openEnterE2EEPasswordModal(onEnterE2EEPassword);

		await getModalProps().onConfirm('password');

		expect(onEnterE2EEPassword).toHaveBeenCalledWith('password');
		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'success', message: 'E2E_encryption_enabled' });
		expect(imperativeModal.close).toHaveBeenCalledTimes(1);
		expect(banners.closeById).toHaveBeenCalledWith('e2e');
	});
});
