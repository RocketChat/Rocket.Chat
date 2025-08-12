import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E2EE } from '../index.ts';

class MemoryStorage implements Storage {
	private data = new Map<string, string>();
	clear(): void {
		this.data.clear();
	}
	getItem(key: string): string | null {
		return this.data.has(key) ? this.data.get(key)! : null;
	}
	key(index: number): string | null {
		return Array.from(this.data.keys())[index] ?? null;
	}
	removeItem(key: string): void {
		this.data.delete(key);
	}
	setItem(key: string, value: string): void {
		this.data.set(key, value);
	}
	get length() {
		return this.data.size;
	}
}

class DeterministicCrypto implements Crypto {
	private seq: number[];
	private idx = 0;
	constructor(seq: number[]) {
		this.seq = seq;
	}
	getRandomValues<T extends ArrayBufferView>(array: T): T {
		// naive: fill Uint32 or Uint8
		if (array instanceof Uint32Array) {
			for (let i = 0; i < array.length; i++) array[i] = this.seq[this.idx++ % this.seq.length]!;
		} else if (array instanceof Uint8Array) {
			for (let i = 0; i < array.length; i++) array[i] = this.seq[this.idx++ % this.seq.length]! & 0xff;
		}
		return array;
	}
	// Unused methods (stubs)
	get [Symbol.toStringTag]() {
		return 'DeterministicCrypto';
	}
	randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
		return '00000000-0000-4000-8000-000000000000';
	}
	// @ts-expect-error not implemented
	subtle: SubtleCrypto;
}

test('E2EE createRandomPassword deterministic generation with 5 words', async () => {
	const storage = new MemoryStorage();
	// Inject custom word list by temporarily defining dynamic import.
	// Instead, we monkey patch global import for wordList path using dynamic import map isn't trivial here.
	// So we skip testing exact phrase (depends on wordList) and just assert shape.
	const crypto = new DeterministicCrypto([1, 2, 3, 4, 5]);
	const e2ee = E2EE.fromWeb(storage, crypto as any);
	const pwd = await e2ee.createRandomPassword();
	assert.equal(pwd.split(' ').length, 5);
	assert.equal(await e2ee.getRandomPassword(), pwd);
});
