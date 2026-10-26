import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { generate } from './crypto/rsa';
import { e2e, e2eSearchIndexSession } from './rocketchat.e2e';
import { deriveSearchIndexWrapKey } from '../e2eeSearch/searchIndexSession';

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

	beforeEach(() => {
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
});
