import { imperativeModal } from '@rocket.chat/ui-client';

import * as banners from '../banners';
import { e2e } from './rocketchat.e2e';
import { sdk } from '../SDKClient';
import { dispatchToastMessage } from '../toast';

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: {
		open: jest.fn(),
		close: jest.fn(),
	},
}));

jest.mock('./rocketchat.e2e.room', () => ({}));
jest.mock('../../stores', () => ({}));
jest.mock('../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../../views/e2e/EnterE2EPasswordModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../views/e2e/SaveE2EPasswordModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../sdk/ddpSdk', () => ({ getDdpSdk: () => ({ account: { onLogout: jest.fn() } }) }));

jest.mock('../../../client/lib/getUserAvatarURL', () => ({
	getUserAvatarURL: jest.fn(),
}));

jest.mock('../../../lib/i18n', () => ({
	t: (key: string) => key,
}));

jest.mock('../toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('../SDKClient', () => ({
	sdk: { rest: { post: jest.fn() } },
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

describe('E2E requestSubscriptionKeys', () => {
	beforeEach(async () => {
		await e2e.stopClient();
		(sdk.rest.post as jest.Mock).mockReset().mockResolvedValue({});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('shares the active request and follows up once for concurrent callers', async () => {
		let resolve!: () => void;
		(sdk.rest.post as jest.Mock).mockReturnValueOnce(
			new Promise<void>((r) => {
				resolve = r;
			}),
		);

		const first = e2e.requestSubscriptionKeys();
		const second = e2e.requestSubscriptionKeys();
		expect(second).toBe(first);
		expect(sdk.rest.post).toHaveBeenCalledTimes(1);
		resolve();
		await Promise.all([first, second]);

		expect(sdk.rest.post).toHaveBeenCalledTimes(2);
		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/e2e.requestSubscriptionKeys');
	});

	it('admits a room that starts waiting after the first server read', async () => {
		const waiting = new Set(['early-room']);
		const admitted = new Set<string>();
		let resolve!: () => void;
		(sdk.rest.post as jest.Mock)
			.mockImplementationOnce(() => {
				waiting.forEach((room) => admitted.add(room));
				return new Promise<void>((done) => {
					resolve = done;
				});
			})
			.mockImplementationOnce(async () => {
				waiting.forEach((room) => admitted.add(room));
			});
		const first = e2e.requestSubscriptionKeys();
		waiting.add('later-room');
		const later = e2e.requestSubscriptionKeys();
		resolve();
		await Promise.all([first, later]);

		expect(admitted).toEqual(new Set(['early-room', 'later-room']));
		expect(sdk.rest.post).toHaveBeenCalledTimes(2);
	});

	it('cancels a dirty follow-up when the session stops', async () => {
		let resolve!: () => void;
		(sdk.rest.post as jest.Mock).mockReturnValueOnce(
			new Promise<void>((done) => {
				resolve = done;
			}),
		);
		const first = e2e.requestSubscriptionKeys();
		e2e.requestSubscriptionKeys();
		await e2e.stopClient();
		resolve();
		await first;
		expect(sdk.rest.post).toHaveBeenCalledTimes(1);
	});

	it('should send a new request after the previous one settles', async () => {
		await e2e.requestSubscriptionKeys();
		await e2e.requestSubscriptionKeys();

		expect(sdk.rest.post).toHaveBeenCalledTimes(2);
	});

	it('should send a new request after the previous one fails', async () => {
		(sdk.rest.post as jest.Mock).mockRejectedValueOnce(new Error('network')).mockRejectedValueOnce(new Error('network'));

		await expect(e2e.requestSubscriptionKeys()).rejects.toThrow('network');
		await e2e.requestSubscriptionKeys();

		expect(sdk.rest.post).toHaveBeenCalledTimes(3);
	});

	it('retries admission once after a transient failure', async () => {
		(sdk.rest.post as jest.Mock).mockRejectedValueOnce(new Error('network'));
		await e2e.requestSubscriptionKeys();
		expect(sdk.rest.post).toHaveBeenCalledTimes(2);
	});

	it('retries a synchronous REST throw without losing request ownership', async () => {
		(sdk.rest.post as jest.Mock).mockImplementationOnce(() => {
			throw new Error('network');
		});

		await expect(e2e.requestSubscriptionKeys()).resolves.toBeUndefined();
		expect(sdk.rest.post).toHaveBeenCalledTimes(2);
	});

	it('rejects after two synchronous REST throws and permits a later request', async () => {
		const fail = () => {
			throw new Error('network');
		};
		(sdk.rest.post as jest.Mock).mockImplementationOnce(fail).mockImplementationOnce(fail);

		await expect(e2e.requestSubscriptionKeys()).rejects.toThrow('network');
		await e2e.requestSubscriptionKeys();
		expect(sdk.rest.post).toHaveBeenCalledTimes(3);
	});

	it('does not retry a synchronous failure after stopClient', async () => {
		(sdk.rest.post as jest.Mock).mockImplementationOnce(() => {
			throw new Error('network');
		});
		const request = e2e.requestSubscriptionKeys();
		await e2e.stopClient();

		await request;
		expect(sdk.rest.post).toHaveBeenCalledTimes(1);
	});

	it('should not share the request of the previous user after stopClient', async () => {
		let resolvePrevious!: () => void;
		let resolveNext!: () => void;
		(sdk.rest.post as jest.Mock)
			.mockReturnValueOnce(
				new Promise<void>((r) => {
					resolvePrevious = r;
				}),
			)
			.mockReturnValueOnce(
				new Promise<void>((r) => {
					resolveNext = r;
				}),
			);

		const previousUser = e2e.requestSubscriptionKeys();
		await e2e.stopClient();
		const nextUser = e2e.requestSubscriptionKeys();
		expect(sdk.rest.post).toHaveBeenCalledTimes(2);

		resolvePrevious();
		await previousUser;
		const sameUser = e2e.requestSubscriptionKeys();
		expect(sdk.rest.post).toHaveBeenCalledTimes(2);

		resolveNext();
		await Promise.all([nextUser, sameUser]);
	});
});
