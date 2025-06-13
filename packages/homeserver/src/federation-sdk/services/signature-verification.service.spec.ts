import {
	describe,
	it,
	beforeEach,
	afterEach,
	expect,
	spyOn,
	mock,
} from 'bun:test';
import { SignatureVerificationService } from './signature-verification.service';
import * as nacl from 'tweetnacl';

describe('SignatureVerificationService', () => {
	let service: SignatureVerificationService;
	let originalFetch: typeof globalThis.fetch;

	const mockOriginServer = 'example.org';
	const mockKeyId = 'ed25519:key1';
	const mockPublicKey = 'abc123publickey==';
	const mockSignature = 'xyz789signature==';

	const mockEvent = {
		type: 'test.event',
		content: { message: 'Hello World' },
		room_id: '!roomid:example.org',
		sender: '@user:example.org',
		origin_server_ts: 1621543830000,
		signatures: {
			[mockOriginServer]: {
				[mockKeyId]: mockSignature,
			},
		},
	};

	const mockKeyData = {
		server_name: mockOriginServer,
		verify_keys: {
			[mockKeyId]: {
				key: mockPublicKey,
			},
		},
	};

	beforeEach(() => {
		originalFetch = globalThis.fetch;

		service = new SignatureVerificationService();

		globalThis.fetch = Object.assign(
			async (_url: string, _options?: RequestInit) => {
				return {
					ok: true,
					status: 200,
					json: async () => mockKeyData,
				} as Response;
			},
			{ preconnect: () => {} },
		) as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		mock.restore();
	});

	describe('verifySignature', () => {
		it('should return false when no signatures exist', async () => {
			const result = await service.verifySignature(
				{ content: 'test' },
				mockOriginServer,
			);
			expect(result).toBe(false);
		});

		it('should return false when no signature for the origin server exists', async () => {
			const result = await service.verifySignature(
				{ signatures: { 'different.server': { [mockKeyId]: mockSignature } } },
				mockOriginServer,
			);
			expect(result).toBe(false);
		});

		it('should return false when no signature keys for the origin server exist', async () => {
			const result = await service.verifySignature(
				{ signatures: { [mockOriginServer]: {} } },
				mockOriginServer,
			);
			expect(result).toBe(false);
		});

		it('should return false when fetching the public key fails', async () => {
			globalThis.fetch = Object.assign(
				async () => {
					return {
						ok: false,
						status: 404,
					} as Response;
				},
				{ preconnect: () => {} },
			) as typeof fetch;

			const result = await service.verifySignature(mockEvent, mockOriginServer);
			expect(result).toBe(false);
		});

		it('should verify signature using provided public key function', async () => {
			const verifyMock = spyOn(nacl.sign.detached, 'verify').mockReturnValue(
				true,
			);

			const getPublicKey = async (_origin: string, _keyId: string) =>
				mockPublicKey;

			const result = await service.verifySignature(
				mockEvent,
				mockOriginServer,
				getPublicKey,
			);

			expect(result).toBe(true);
			expect(verifyMock).toHaveBeenCalledTimes(1);
		});

		it('should verify signature by fetching the public key', async () => {
			const verifyMock = spyOn(nacl.sign.detached, 'verify').mockReturnValue(
				true,
			);

			const result = await service.verifySignature(mockEvent, mockOriginServer);

			expect(result).toBe(true);
			expect(verifyMock).toHaveBeenCalledTimes(1);
		});

		it('should return false when signature verification fails', async () => {
			const verifyMock = spyOn(nacl.sign.detached, 'verify').mockReturnValue(
				false,
			);

			const result = await service.verifySignature(mockEvent, mockOriginServer);

			expect(result).toBe(false);
			expect(verifyMock).toHaveBeenCalledTimes(1);
		});

		it('should exclude signatures and unsigned fields when verifying', async () => {
			const verifyMock = spyOn(nacl.sign.detached, 'verify').mockImplementation(
				(message, _signature, _publicKey) => {
					const eventJson = JSON.parse(Buffer.from(message).toString());
					expect(eventJson.signatures).toBeUndefined();
					expect(eventJson.unsigned).toBeUndefined();
					return true;
				},
			);

			const eventWithUnsigned = {
				...mockEvent,
				unsigned: { age_ts: 12345 },
			};

			const result = await service.verifySignature(
				eventWithUnsigned,
				mockOriginServer,
			);

			expect(result).toBe(true);
			expect(verifyMock).toHaveBeenCalledTimes(1);
		});

		it('should return false when an error is thrown during verification', async () => {
			spyOn(nacl.sign.detached, 'verify').mockImplementation(() => {
				throw new Error('Mock error');
			});

			const result = await service.verifySignature(mockEvent, mockOriginServer);
			expect(result).toBe(false);
		});

		it('should use cached key data when available', async () => {
			const fetchSpy = spyOn(globalThis, 'fetch');
			const verifyMock = spyOn(nacl.sign.detached, 'verify').mockReturnValue(
				true,
			);

			await service.verifySignature(mockEvent, mockOriginServer);
			expect(fetchSpy).toHaveBeenCalledTimes(1);

			fetchSpy.mockReset();

			const result = await service.verifySignature(mockEvent, mockOriginServer);

			expect(result).toBe(true);
			expect(fetchSpy).toHaveBeenCalledTimes(0);
			expect(verifyMock).toHaveBeenCalledTimes(2);
		});
	});
});
