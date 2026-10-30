import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

import { e2e, e2eSearchIndexRuntime, e2eSearchIndexWriter } from './rocketchat.e2e';
import { E2ERoom } from './rocketchat.e2e.room';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: {} }));
jest.mock('./crypto/rsa', () => ({}));
jest.mock('./helper', () => ({}));
jest.mock('./keychain', () => ({}));
jest.mock('./logger', () => ({ createLogger: () => ({ span: () => ({ set: jest.fn().mockReturnThis(), info: jest.fn() }) }) }));
jest.mock('./rocketchat.e2e.room', () => ({ E2ERoom: jest.fn() }));
jest.mock('../../stores', () => ({}));
jest.mock('../../views/e2e/EnterE2EPasswordModal', () => ({}));
jest.mock('../../views/e2e/SaveE2EPasswordModal', () => ({}));
jest.mock('../SDKClient', () => ({}));
jest.mock('../banners', () => ({}));
jest.mock('../getUserAvatarURL', () => ({}));
jest.mock('../sdk/ddpSdk', () => ({ getDdpSdk: () => ({ account: { onLogout: jest.fn() } }) }));
jest.mock('../sdk/storage', () => ({}));
jest.mock('../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../toast', () => ({}));
jest.mock('../../../lib/i18n', () => ({ t: (key: string) => key }));

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
const message = (): IMessage => ({
	_id: 'm',
	rid: 'r',
	t: 'e2e',
	e2e: 'pending',
	msg: 'ciphertext',
	u: { _id: 'u', username: 'alice' },
	ts: new Date(),
	_updatedAt: new Date(),
});
const internal = e2e as unknown as {
	userId: string;
	startGeneration: number;
	instancesByRoomId: Record<string, E2ERoom>;
	waitForRoom(rid: string): Promise<IRoom>;
};

afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
	internal.instancesByRoomId = {};
});

it('captures the index handle before decryption and rejects a completed old-session decrypt', async () => {
	const decrypt = deferred<IMessage>();
	const index = jest.fn();
	jest.spyOn(e2eSearchIndexWriter, 'bindToOpenIndex').mockReturnValue(index);
	jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: () => decrypt.promise } as unknown as E2ERoom);
	const pending = e2e.decryptMessage(message(), { quoteDepth: 0 });
	expect(e2eSearchIndexWriter.bindToOpenIndex).toHaveBeenCalledTimes(1);
	internal.startGeneration++;
	decrypt.resolve({ ...message(), e2e: 'done', msg: 'plaintext' });
	await pending;
	expect(index).not.toHaveBeenCalled();
});

it('indexes current plaintext and registers missing-key messages for retry', async () => {
	const index = jest.fn();
	jest.spyOn(e2eSearchIndexWriter, 'bindToOpenIndex').mockReturnValue(index);
	const failed = { ...message(), e2e: 'done' as const, msg: 'unreadable', decryptFailed: true as const };
	jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: async () => failed } as unknown as E2ERoom);
	const encrypted = message();
	await e2e.decryptMessage(encrypted, { quoteDepth: 0 });
	expect(index).toHaveBeenCalledWith(failed);
	expect(e2eSearchIndexRuntime.onDecryptFailed).toHaveBeenCalledWith(encrypted);
});

it('removes deletion placeholders without decryption', async () => {
	const lookup = jest.spyOn(e2e, 'getInstanceByRoomId');
	const removed = { ...message(), t: 'rm' as const, msg: '' };
	await expect(e2e.decryptMessage(removed)).resolves.toBe(removed);
	expect(e2eSearchIndexWriter.index).toHaveBeenCalledWith(removed);
	expect(lookup).not.toHaveBeenCalled();
});

it('waits for old room keys and ignores a retired room instance', async () => {
	internal.userId = 'u';
	const keys = deferred<void>();
	const room = Object.assign(new Emitter(), { whenOldRoomKeysLoaded: () => keys.promise });
	jest.mocked(E2ERoom).mockImplementation(() => room as unknown as E2ERoom);
	jest.spyOn(internal, 'waitForRoom').mockResolvedValue({ _id: 'r', t: 'p', encrypted: true } as IRoom);
	const ready = jest.fn();
	const off = e2e.on('E2E_ROOM_READY', ready);
	try {
		await e2e.getInstanceByRoomId('r');
		room.emit('READY');
		expect(ready).not.toHaveBeenCalled();
		keys.resolve();
		await keys.promise;
		expect(ready).toHaveBeenCalledWith('r');
		ready.mockClear();
		delete internal.instancesByRoomId.r;
		room.emit('READY');
		await Promise.resolve();
		expect(ready).not.toHaveBeenCalled();
	} finally {
		off();
	}
});
