import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import {
	generateKeyPairs,
	generateKeyPairsFromString,
	getKeyPair,
} from './keys';
import { EncryptionValidAlgorithm } from './signJson';
import { toUnpaddedBase64 } from './binaryData';
import nacl from 'tweetnacl';

describe('keys', () => {
	describe('generateKeyPairs', () => {
		it('should generate key pairs with default algorithm and version', async () => {
			const seed = nacl.randomBytes(nacl.sign.seedLength);
			const keyPair = await generateKeyPairs(seed);

			expect(keyPair.algorithm).toBe(EncryptionValidAlgorithm.ed25519);
			expect(keyPair.version).toBe('0');
			expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
			expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
		});

		it('should generate key pairs with specified algorithm and version', async () => {
			const seed = nacl.randomBytes(nacl.sign.seedLength);
			const algorithm = EncryptionValidAlgorithm.ed25519;
			const version = '1';
			const keyPair = await generateKeyPairs(seed, algorithm, version);

			expect(keyPair.algorithm).toBe(algorithm);
			expect(keyPair.version).toBe(version);
		});

		it('should sign data correctly', async () => {
			const seed = nacl.randomBytes(nacl.sign.seedLength);
			const keyPair = await generateKeyPairs(seed);
			const data = new TextEncoder().encode('test data');
			const signature = await keyPair.sign(data);

			expect(signature).toBeInstanceOf(Uint8Array);

			const isValid = nacl.sign.detached.verify(
				data,
				signature,
				keyPair.publicKey,
			);

			expect(isValid).toBe(true);
		});
	});

	describe('generateKeyPairsFromString', () => {
		it('should generate key pairs from a valid string', async () => {
			const seed = nacl.randomBytes(nacl.sign.seedLength);
			const seedString = Buffer.from(seed).toString('base64');
			const content = `${EncryptionValidAlgorithm.ed25519} 1 ${seedString}`;
			const keyPair = await generateKeyPairsFromString(content);

			expect(keyPair.algorithm).toBe(EncryptionValidAlgorithm.ed25519);
			expect(keyPair.version).toBe('1');

			const expectedKeyPair = await nacl.sign.keyPair.fromSeed(seed);

			expect(keyPair.publicKey).toEqual(expectedKeyPair.publicKey);
			expect(keyPair.privateKey).toEqual(expectedKeyPair.secretKey);
		});
	});

	describe('getKeyPair', () => {
		const signingKeyPath = '/tmp/test-signing.key';
		let bunFileSpy: any;
		let bunWriteSpy: any;

		beforeEach(() => {
			bunFileSpy = spyOn(Bun, 'file') as any;
			bunWriteSpy = spyOn(Bun, 'write').mockResolvedValue(0);
		});

		afterEach(async () => {
			bunFileSpy.mockRestore();
			bunWriteSpy.mockRestore();
			try {
				// @ts-ignore
				await Bun.fs.unlink(signingKeyPath);
			} catch (e) {
				// Ignore if file doesn't exist
			}
		});

		it('should generate and store new key pairs if file does not exist', async () => {
			bunFileSpy.mockImplementation((_path: string) => ({
				exists: async () => false,
				text: async () => '',
			}));

			const keyPairs = await getKeyPair({ signingKeyPath });

			expect(keyPairs.length).toBe(1);

			const keyPair = keyPairs[0];

			expect(keyPair.algorithm).toBe(EncryptionValidAlgorithm.ed25519);
			expect(keyPair.version).toBe('0');
			expect(bunWriteSpy).toHaveBeenCalledTimes(1);

			const writeCallArg = bunWriteSpy.mock.calls[0][1] as string;

			expect(writeCallArg.startsWith('ed25519 0 ')).toBe(true);
		});

		it('should load key pairs from existing file', async () => {
			const seed = nacl.randomBytes(nacl.sign.seedLength);
			const seedString = toUnpaddedBase64(seed);
			const fileContent = `${EncryptionValidAlgorithm.ed25519} 1 ${seedString}`;

			bunFileSpy.mockImplementation((_: string) => ({
				exists: async () => true,
				text: async () => fileContent,
			}));

			const keyPairs = await getKeyPair({ signingKeyPath });

			expect(keyPairs.length).toBe(1);

			const keyPair = keyPairs[0];

			expect(keyPair.algorithm).toBe(EncryptionValidAlgorithm.ed25519);
			expect(keyPair.version).toBe('1');

			const expectedKeyPair = await nacl.sign.keyPair.fromSeed(seed);

			expect(keyPair.publicKey).toEqual(expectedKeyPair.publicKey);
			expect(keyPair.privateKey).toEqual(expectedKeyPair.secretKey);
			expect(bunWriteSpy).not.toHaveBeenCalled();
		});
	});
});
