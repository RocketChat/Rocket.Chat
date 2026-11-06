import { Emitter } from '@rocket.chat/emitter';
import { imperativeModal } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import * as banners from '../banners';
import { e2e } from './rocketchat.e2e';
import type { E2ERoom } from './rocketchat.e2e.room';
import { createFakeSubscription } from '../../../tests/mocks/data';
import { dispatchToastMessage } from '../toast';

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
}));

jest.mock('../../../client/lib/getUserAvatarURL', () => ({
	getUserAvatarURL: jest.fn(),
}));

jest.mock('../../../lib/i18n', () => ({
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

describe('E2E.decryptSubscription', () => {
	it('should wait for the room keys before decrypting the last message', async () => {
		const e2eRoom = Object.assign(new Emitter(), { isReady: () => false, decryptSubscription: jest.fn() });
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue(e2eRoom as unknown as E2ERoom);

		await e2e.decryptSubscription(createFakeSubscription({ rid: 'room-1' }) as SubscriptionWithRoom);

		expect(e2eRoom.decryptSubscription).not.toHaveBeenCalled();

		e2eRoom.emit('READY');

		expect(e2eRoom.decryptSubscription).toHaveBeenCalled();
	});
});

describe('E2E.startClient', () => {
	afterEach(() => {
		Reflect.deleteProperty(window, 'isSecureContext');
	});

	it('should refuse to start on a page that is not served over HTTPS', async () => {
		Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });

		await expect(e2e.startClient('user-1')).rejects.toThrow('secure contexts');
	});
});
