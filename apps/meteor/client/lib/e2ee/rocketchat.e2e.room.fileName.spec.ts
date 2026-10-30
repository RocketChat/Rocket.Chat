import { createHash, webcrypto } from 'node:crypto';

import { E2ERoom } from './rocketchat.e2e.room';

jest.mock('./rocketchat.e2e', () => ({ e2e: { isReady: () => false } }));
jest.mock('../rooms/roomCoordinator', () => ({ roomCoordinator: {} }));
jest.mock('../../stores', () => ({}));
jest.mock('../../../lib/i18n', () => ({ t: (key: string) => key }));

jest.mock('../../../client/lib/SDKClient', () => ({
	sdk: { rest: { post: jest.fn() } },
}));
jest.mock('../../../rocketchat.info', () => ({
	Info: { version: '8.7.0' },
}));

const sha256Hex = (text: string) => createHash('sha256').update(text).digest('hex');

const makeRoomWithKey = async (rid: string) => {
	const room = new E2ERoom('user-1', { _id: rid, t: 'p', encrypted: true } as any);
	room.groupSessionKey = (await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])) as any;
	return room;
};

// jsdom's File has no arrayBuffer(), which encryptFile reads.
const fileNamed = (name: string) => {
	const content = new TextEncoder().encode('file content');
	return Object.assign(new File([content], name, { type: 'text/plain' }), { arrayBuffer: async () => content.buffer });
};

describe('E2ERoom.encryptFile file name', () => {
	const NAME = 'salary-2026.xlsx';

	it('uploads the file under 64 random hex characters, not a hash of its name', async () => {
		const room = await makeRoomWithKey('room-1');

		const encrypted = await room.encryptFile(fileNamed(NAME));

		expect(encrypted?.file.name).toMatch(/^[0-9a-f]{64}$/);
		expect(encrypted?.file.name).not.toBe(sha256Hex(NAME));
	});

	it('gives two uploads of the same name in the same room different names, so the server cannot see that they match', async () => {
		const room = await makeRoomWithKey('room-1');

		const first = await room.encryptFile(fileNamed(NAME));
		const second = await room.encryptFile(fileNamed(NAME));

		expect(first?.file.name).not.toBe(second?.file.name);
	});

	it('takes the name from 32 bytes of crypto.getRandomValues', async () => {
		const room = await makeRoomWithKey('room-1');
		const getRandomValues = jest.spyOn(crypto, 'getRandomValues');

		const encrypted = await room.encryptFile(fileNamed(NAME));

		const nameBytes = getRandomValues.mock.results
			.map(({ value }) => value as Uint8Array)
			.find((bytes) => bytes.length === 32 && Buffer.from(bytes).toString('hex') === encrypted?.file.name);
		expect(nameBytes).toBeDefined();
		getRandomValues.mockRestore();
	});
});
