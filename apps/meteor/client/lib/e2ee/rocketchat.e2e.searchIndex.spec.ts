import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { waitFor } from '@testing-library/react';

import { generate } from './crypto/rsa';
import { e2e, e2eSearchIndexSession, e2eSearchIndexWriter } from './rocketchat.e2e';
import { E2ERoom } from './rocketchat.e2e.room';
import { PublicSettings, Rooms, Subscriptions } from '../../stores';
import { sdk } from '../SDKClient';
import { setSearchIndexOptIn } from '../e2eeSearch/searchIndexOptIn';
import { deriveSearchIndexWrapKey } from '../e2eeSearch/searchIndexSession';
import { settings } from '../settings';

jest.mock('@rocket.chat/ui-client', () => ({
	imperativeModal: { open: jest.fn(), close: jest.fn() },
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

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'listRooms', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
};

describe('E2E client and the local search index', () => {
	let bridge: jest.Mocked<ISearchIndexBackend>;
	let localSearchAllowed: boolean;

	beforeEach(() => {
		localSearchAllowed = true;
		PublicSettings.state.store({ _id: 'E2E_Enable_Local_Search', value: true } as never);
		window.localStorage.clear();
		setSearchIndexOptIn('u1', true);
		Subscriptions.state.replaceAll([{ _id: 's1', rid: 'r1', u: { _id: 'u1' } } as never]);
		const peek = settings.peek.bind(settings);
		jest
			.spyOn(settings, 'peek')
			.mockImplementation((id: string) => (id === 'E2E_Enable_Local_Search' ? localSearchAllowed : peek(id)) as never);
		bridge = Object.fromEntries(
			methods.map((method) => [method, jest.fn(async () => undefined)]),
		) as unknown as jest.Mocked<ISearchIndexBackend>;
		bridge.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true });
		(window as { RocketChatDesktop?: unknown }).RocketChatDesktop = { e2eeSearch: bridge };
		jest.spyOn(e2e, 'onE2EEReady').mockResolvedValue(undefined);
	});

	afterEach(() => {
		(window as { RocketChatDesktop?: unknown }).RocketChatDesktop = undefined;
		jest.restoreAllMocks();
	});

	it('opens the desktop index with the derived wrap key when E2EE becomes ready, and stops using it on logout', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();

		expect(bridge.open).toHaveBeenCalledTimes(1);
		const [scope] = bridge.open.mock.calls[0];
		expect(scope.userId).toBe('u1');
		expect(toHex(scope.wrapKey as Uint8Array)).toBe(toHex(await deriveSearchIndexWrapKey(privateKey, 'u1')));
		expect(e2eSearchIndexSession.getActiveBackend()).toBeDefined();

		await e2e.stopClient();

		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();
	});

	it('indexes a message that decryptMessage decrypts while the index is open, and nothing after logout', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;
		const encrypted = {
			_id: 'm1',
			rid: 'r1',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		};
		const decrypted = { ...encrypted, e2e: 'done', msg: 'budget review on friday' };
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: jest.fn(async () => decrypted) } as never);
		jest.spyOn(e2e, 'parseQuoteAttachment').mockImplementation(async (message) => message);

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		await e2e.decryptMessage(encrypted as never);
		await e2eSearchIndexWriter.flush();

		expect(bridge.upsert).toHaveBeenCalledTimes(1);
		expect(bridge.upsert.mock.calls[0][0]).toEqual([expect.objectContaining({ id: 'm1', rid: 'r1', body: 'budget review on friday' })]);

		await e2e.stopClient();
		await e2e.decryptMessage(encrypted as never);
		await e2eSearchIndexWriter.flush();

		expect(bridge.upsert).toHaveBeenCalledTimes(1);
	});

	it('removes a message from the index when it arrives again as a deletion placeholder, and does not index it again', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;
		const encrypted = {
			_id: 'm-deleted',
			rid: 'r1',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		};
		const decrypted = { ...encrypted, e2e: 'done', msg: 'budget review on friday' };
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: jest.fn(async () => decrypted) } as never);
		jest.spyOn(e2e, 'parseQuoteAttachment').mockImplementation(async (message) => message);

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		await e2e.decryptMessage(encrypted as never);
		await e2eSearchIndexWriter.flush();
		expect(bridge.upsert).toHaveBeenCalledTimes(1);

		const placeholder = { ...encrypted, t: 'rm', msg: '', editedAt: new Date(), editedBy: { _id: 'u2', username: 'bob' } };
		await e2e.decryptMessage(placeholder as never);
		await e2eSearchIndexWriter.flush();

		expect(bridge.remove).toHaveBeenCalledWith(['m-deleted']);

		// A decrypt of the old version that ends after the delete does not bring its text back.
		await e2e.decryptMessage(encrypted as never);
		await e2eSearchIndexWriter.flush();
		expect(bridge.upsert).toHaveBeenCalledTimes(1);

		await e2e.stopClient();
	});

	it('indexes a live message that failed to decrypt (room key missing) after the room key arrives', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;
		const encrypted = {
			_id: 'm1',
			rid: 'r1',
			t: 'e2e',
			e2e: 'pending',
			msg: 'ciphertext',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		};
		const roomDecrypt = jest
			.fn()
			.mockResolvedValueOnce({ ...encrypted, e2e: 'done', msg: 'E2E_Key_Error', decryptFailed: true })
			.mockResolvedValue({ ...encrypted, e2e: 'done', msg: 'budget review on friday' });
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: roomDecrypt } as never);
		jest.spyOn(e2e, 'parseQuoteAttachment').mockImplementation(async (message) => message);

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		await e2e.decryptMessage(encrypted as never);
		await e2eSearchIndexWriter.flush();

		expect(bridge.upsert).not.toHaveBeenCalled();

		e2e.emit('E2E_ROOM_READY', 'r1');

		await waitFor(() => expect(bridge.upsert).toHaveBeenCalledTimes(1));
		expect(bridge.upsert.mock.calls[0][0]).toEqual([expect.objectContaining({ id: 'm1', rid: 'r1', body: 'budget review on friday' })]);
		expect(roomDecrypt).toHaveBeenLastCalledWith(expect.objectContaining({ _id: 'm1', e2e: 'pending', msg: 'ciphertext' }));

		await e2e.stopClient();
	});

	it('does not index a message whose decrypt ends after the user left its room (for example, a quoted message)', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;
		const encrypted = {
			_id: 'm2',
			rid: 'r2',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		};
		Subscriptions.state.replaceAll([
			{ _id: 's1', rid: 'r1', u: { _id: 'u1' } },
			{ _id: 's2', rid: 'r2', u: { _id: 'u1' } },
		] as never);
		const roomDecrypt = deferred<unknown>();
		const decryptInRoom = jest.fn(() => roomDecrypt.promise);
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: decryptInRoom } as never);
		jest.spyOn(e2e, 'parseQuoteAttachment').mockImplementation(async (message) => message);

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		const decrypting = e2e.decryptMessage(encrypted as never);
		await waitFor(() => expect(decryptInRoom).toHaveBeenCalled());

		// The user leaves the room while the decrypt runs.
		Subscriptions.state.replaceAll([{ _id: 's1', rid: 'r1', u: { _id: 'u1' } }] as never);
		roomDecrypt.resolve({ ...encrypted, e2e: 'done', msg: 'left room words' });
		await decrypting;
		await e2eSearchIndexWriter.flush();

		expect(bridge.upsert).not.toHaveBeenCalled();

		await e2e.stopClient();
	});

	it('does not index a message whose decrypt ends after another user logged in on the same page', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;
		const encrypted = {
			_id: 'm3',
			rid: 'r1',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		};
		const decrypted = { ...encrypted, e2e: 'done', msg: 'words of the first user' };
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: jest.fn(async () => decrypted) } as never);
		const quote = deferred<never>();
		const parseQuote = jest.spyOn(e2e, 'parseQuoteAttachment').mockImplementation(() => quote.promise);

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		const decrypting = e2e.decryptMessage(encrypted as never);
		await waitFor(() => expect(parseQuote).toHaveBeenCalled());

		// Another user logs in with no page reload, and the index of that user opens.
		await e2e.stopClient();
		setSearchIndexOptIn('u3', true);
		Subscriptions.state.replaceAll([{ _id: 's3', rid: 'r1', u: { _id: 'u3' } }] as never);
		const { privateKey: privateKeyOfSecondUser } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u3';
		e2e.privateKey = privateKeyOfSecondUser;
		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		expect(e2eSearchIndexSession.getActiveBackend()).toBeDefined();

		quote.resolve(decrypted as never);
		await decrypting;
		await e2eSearchIndexWriter.flush();

		expect(bridge.upsert).not.toHaveBeenCalled();

		await e2e.stopClient();
	});

	it('asks to decrypt the failed messages of a room again only after the old keys of the room are loaded', async () => {
		(e2e as unknown as { userId: string }).userId = 'u1';
		Rooms.state.store({ _id: 'r1', t: 'p', encrypted: true } as never);
		const oldKeys = deferred<void>();
		jest.spyOn(E2ERoom.prototype, 'handshake').mockResolvedValue(undefined);
		jest.spyOn(E2ERoom.prototype, 'decryptOldRoomKeys').mockReturnValue(oldKeys.promise);
		const decryptPending = jest.spyOn(E2ERoom.prototype, 'decryptPendingMessages').mockResolvedValue(undefined);
		jest.spyOn(E2ERoom.prototype, 'decryptSubscription').mockResolvedValue(undefined);
		const roomReady = jest.fn();
		const off = e2e.on('E2E_ROOM_READY', roomReady);

		const e2eRoom = await e2e.getInstanceByRoomId('r1');
		e2eRoom?.setState('ESTABLISHING');
		e2eRoom?.setState('READY');
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(e2eRoom?.isReady()).toBe(true);
		expect(roomReady).not.toHaveBeenCalled();
		expect(decryptPending).not.toHaveBeenCalled();

		oldKeys.resolve();
		await waitFor(() => expect(roomReady).toHaveBeenCalledWith('r1'));
		expect(decryptPending).toHaveBeenCalledTimes(1);

		off();
		Rooms.state.delete('r1');
		await e2e.stopClient();
	});

	it('wipes the desktop index at login without an open and indexes nothing when the admin setting is off (the default)', async () => {
		localSearchAllowed = false;
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;
		const encrypted = {
			_id: 'm1',
			rid: 'r1',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		};
		jest
			.spyOn(e2e, 'getInstanceByRoomId')
			.mockResolvedValue({ decryptMessage: jest.fn(async () => ({ ...encrypted, e2e: 'done', msg: 'budget review' })) } as never);
		jest.spyOn(e2e, 'parseQuoteAttachment').mockImplementation(async (message) => message);

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		await e2e.decryptMessage(encrypted as never);
		await e2eSearchIndexWriter.flush();

		expect(bridge.wipe).toHaveBeenCalledTimes(1);
		expect(bridge.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(bridge.open).not.toHaveBeenCalled();
		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();
		expect(bridge.upsert).not.toHaveBeenCalled();

		await e2e.stopClient();
	});

	it('wipes the desktop index at login without an open when the admin allows local search but the user did not opt in on this device', async () => {
		setSearchIndexOptIn('u1', false);
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();

		expect(bridge.wipe).toHaveBeenCalledTimes(1);
		expect(bridge.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(bridge.open).not.toHaveBeenCalled();
		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();

		await e2e.stopClient();
	});

	it('opens the index for an opted-in user when the admin turns local search back on, and wipes it when the admin turns it off', async () => {
		const setAdminSetting = (value: boolean) => {
			localSearchAllowed = value;
			PublicSettings.state.store({ _id: 'E2E_Enable_Local_Search', value } as never);
		};
		setAdminSetting(false);
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		expect(bridge.open).not.toHaveBeenCalled();
		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();

		setAdminSetting(true);
		await e2eSearchIndexSession.whenSettled();

		expect(bridge.open).toHaveBeenCalledTimes(1);
		expect(e2eSearchIndexSession.getActiveBackend()).toBeDefined();

		bridge.wipe.mockClear();
		setAdminSetting(false);
		await e2eSearchIndexSession.whenSettled();

		expect(bridge.wipe).toHaveBeenCalledTimes(1);
		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();

		await e2e.stopClient();
	});

	it('wipes the open index at once when the user turns the opt-in off, and opens it again when the user turns it on', async () => {
		const { privateKey } = await generate();
		(e2e as unknown as { userId: string }).userId = 'u1';
		e2e.privateKey = privateKey;

		e2e.setState('READY');
		await e2eSearchIndexSession.whenSettled();
		expect(e2eSearchIndexSession.getActiveBackend()).toBeDefined();

		setSearchIndexOptIn('u1', false);
		await e2eSearchIndexSession.whenSettled();

		expect(bridge.wipe).toHaveBeenCalledTimes(1);
		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();

		setSearchIndexOptIn('u1', true);
		await e2eSearchIndexSession.whenSettled();

		expect(e2eSearchIndexSession.getActiveBackend()).toBeDefined();

		await e2e.stopClient();
	});
	describe('quoted message links', () => {
		const loopingMessage = () => ({
			_id: 'm-loop',
			rid: 'r1',
			t: 'e2e',
			e2e: 'pending',
			msg: '',
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(),
			_updatedAt: new Date(),
		});

		beforeEach(() => {
			const peek = settings.peek as jest.MockedFunction<typeof settings.peek>;
			const allowed = peek.getMockImplementation();
			peek.mockImplementation(((id: string) => {
				if (id === 'Site_Url') return 'http://localhost:3000';
				if (id === 'Message_QuoteChainLimit') return 2;
				return allowed?.(id);
			}) as never);
			// The message quotes itself, so each decrypt finds the same link again.
			jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({
				decryptMessage: jest.fn(async (message: object) => ({ ...message, e2e: 'done', msg: 'see http://localhost:3000/?msg=m-loop' })),
			} as never);
			jest.spyOn(sdk.rest, 'get').mockImplementation((async () => ({
				message: { ...loopingMessage(), ts: new Date().toISOString(), _updatedAt: new Date().toISOString() },
			})) as never);
		});

		it('follows a message that quotes itself only down to the quote chain limit', async () => {
			await e2e.decryptMessage(loopingMessage() as never);

			expect(sdk.rest.get).toHaveBeenCalledTimes(2);
		});

		it('follows no quoted message link when the quote depth is 0, as the search index crawler asks', async () => {
			const decrypted = await e2e.decryptMessage(loopingMessage() as never, { quoteDepth: 0 });

			expect(sdk.rest.get).not.toHaveBeenCalled();
			expect(decrypted.msg).toBe('see http://localhost:3000/?msg=m-loop');
		});
	});
});
