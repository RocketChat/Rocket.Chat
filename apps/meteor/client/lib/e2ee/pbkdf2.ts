import { Binary } from './binary';

export type Pbkdf2Options = {
	salt: string;
	iterations: number;
};

export type Pbkdf2 = {
	decrypt: (iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>) => Promise<string>;
	encrypt: (data: string) => Promise<{ iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer }>;
};

export function getMasterKey(password: string, { salt, iterations }: Pbkdf2Options): Pbkdf2 {
	const encodedPassword = Binary.toArrayBuffer(password);
	const encodedSalt = Binary.toArrayBuffer(salt);

	const deriveKey = async (mode: 'CBC' | 'GCM') => {
		const derivedKey = await crypto.subtle.deriveKey(
			{ name: 'PBKDF2', hash: 'SHA-256', salt: encodedSalt, iterations } satisfies Pbkdf2Params,
			await crypto.subtle.importKey('raw', encodedPassword, { name: 'PBKDF2' }, false, ['deriveKey']),
			{ name: `AES-${mode}`, length: 256 } satisfies AesKeyGenParams,
			true,
			['encrypt', 'decrypt'],
		);
		return derivedKey;
	};

	return {
		decrypt: async (iv, data) => {
			if (iv.length !== 12 && iv.length !== 16) {
				throw new Error('Invalid IV length. Must be 12 (for AES-GCM) or 16 (for AES-CBC) bytes.');
			}
			const key = await deriveKey(iv.length === 16 ? 'CBC' : 'GCM');
			const decrypted = await crypto.subtle.decrypt({ name: key.algorithm.name, iv }, key, data);
			return Binary.toString(decrypted);
		},
		encrypt: async (data) => {
			// Always use AES-GCM for new data
			const key = await deriveKey('GCM');
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, Binary.toArrayBuffer(data));
			return { iv, ciphertext };
		},
	};
}
