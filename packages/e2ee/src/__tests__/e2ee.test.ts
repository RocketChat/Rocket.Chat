// import { BaseE2EE, type KeyPair, type KeyService, type KeyStorage } from '../index.ts';
// import {}

// class TestE2EE extends BaseE2EE {
// 	constructor() {
// 		super({

// 		})
// 	}
// }

// class MemoryStorage implements KeyStorage {
// 	private map = new Map<string, string>();

// 	load(keyName: string): Promise<string | null> {
// 		return Promise.resolve(this.map.get(keyName) ?? null);
// 	}
// 	store(keyName: string, value: string): Promise<void> {
// 		this.map.set(keyName, value);
// 		return Promise.resolve();
// 	}
// 	remove(keyName: string): Promise<void> {
// 		this.map.delete(keyName);
// 		return Promise.resolve();
// 	}
// }

// class DeterministicCrypto {
// 	private seq: number[];
// 	private idx = 0;
// 	constructor(seq: number[], subtle: webcrypto.SubtleCrypto, CryptoKey: webcrypto.CryptoKeyConstructor) {
// 		this.seq = seq;
// 		// Use provided SubtleCrypto, else fall back to environment's, else a no-op placeholder.
// 		this.subtle = subtle;
// 		this.CryptoKey = CryptoKey;
// 	}
// 	CryptoKey: webcrypto.CryptoKeyConstructor;
// 	subtle: webcrypto.SubtleCrypto;
// 	getRandomValues<T extends ArrayBufferView>(array: T): T {
// 		if (array instanceof Uint32Array) {
// 			for (let i = 0; i < array.length; i++) array[i] = this.seq[this.idx++ % this.seq.length]!;
// 		} else if (array instanceof Uint8Array) {
// 			for (let i = 0; i < array.length; i++) array[i] = this.seq[this.idx++ % this.seq.length]! & 0xff;
// 		}
// 		return array;
// 	}
// 	get [Symbol.toStringTag]() {
// 		return 'DeterministicCrypto';
// 	}
// 	randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
// 		const bytes = new Uint8Array(16);
// 		this.getRandomValues(bytes);
// 		// RFC 4122 variant & version adjustments
// 		bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
// 		bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10
// 		const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
// 		return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}` as `${string}-${string}-${string}-${string}-${string}`;
// 	}
// }

// class MockedKeyService implements KeyService {
// 	fetchMyKeys(): Promise<KeyPair> {
// 		return Promise.resolve({
// 			public_key: 'mocked_public_key',
// 			private_key: 'mocked_private_key',
// 		});
// 	}
// }

// test('E2EE createRandomPassword deterministic generation with 5 words', async () => {
// 	const storage = new MemoryStorage();
// 	// Inject custom word list by temporarily defining dynamic import.
// 	// Instead, we monkey patch global import for wordList path using dynamic import map isn't trivial here.
// 	// So we skip testing exact phrase (depends on wordList) and just assert shape.
// 	const deterministicCrypto = new DeterministicCrypto([1, 2, 3, 4, 5], webcrypto.subtle, webcrypto.CryptoKey);
// 	const mockedKeyService = new MockedKeyService();
// 	const e2ee = new E2EE(storage, deterministicCrypto, mockedKeyService);
// 	const pwd = await e2ee.createRandomPassword();
// 	assert.equal(pwd.split(' ').length, 5);
// 	assert.equal(await e2ee.getRandomPassword(), pwd);
// });
export {};
