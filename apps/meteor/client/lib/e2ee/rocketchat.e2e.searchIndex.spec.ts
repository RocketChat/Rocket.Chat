import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { generate } from './crypto/rsa';
import { e2e, e2eSearchIndexSession, e2eSearchIndexWriter } from './rocketchat.e2e';
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

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

describe('E2E client and the local search index', () => {
	let bridge: jest.Mocked<ISearchIndexBackend>;
	let localSearchAllowed: boolean;

	beforeEach(() => {
		localSearchAllowed = true;
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

	it('wipes the desktop index at login and indexes nothing when the admin setting is off (the default)', async () => {
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
		expect(e2eSearchIndexSession.getActiveBackend()).toBeUndefined();
		expect(bridge.upsert).not.toHaveBeenCalled();

		await e2e.stopClient();
	});
});
