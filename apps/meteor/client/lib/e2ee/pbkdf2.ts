import ByteBuffer from 'bytebuffer';

export type Pbkdf2Options = {
	salt: string;
	iterations: number;
};

export type Pbkdf2 = {
	decrypt: (iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>) => Promise<string>;
	encrypt: (data: string) => Promise<{ iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer }>;
};

export function getMasterKey(password: string, { salt, iterations }: Pbkdf2Options): Pbkdf2 {
	const deriveKey = async (mode: 'CBC' | 'GCM') => {
		const encodedPassword = ByteBuffer.wrap(password, 'binary').toArrayBuffer();
		const baseKey = await crypto.subtle.importKey('raw', encodedPassword, { name: 'PBKDF2' }, false, ['deriveKey']);
		const derivedKey = await crypto.subtle.deriveKey(
			{ name: 'PBKDF2', hash: 'SHA-256', salt: ByteBuffer.fromBinary(salt).toArrayBuffer(), iterations } satisfies Pbkdf2Params,
			baseKey,
			{ name: `AES-${mode}`, length: 256 } satisfies AesKeyGenParams,
			true,
			['encrypt', 'decrypt'],
		);
		return derivedKey;
	}

	return {
		decrypt: async (iv, data) => {
			if (iv.length !== 12 && iv.length !== 16) {
				throw new Error('Invalid IV length. Must be 12 (for AES-GCM) or 16 (for AES-CBC) bytes.');
			}

			const key = await deriveKey(iv.length === 16 ? 'CBC' : 'GCM');
			const decrypted = await crypto.subtle.decrypt({ name: key.algorithm.name, iv }, key, data);
			return ByteBuffer.wrap(decrypted).toString('binary');
		},
		encrypt: async (data) => {
			// Always use AES-GCM for new data
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const key = await deriveKey('GCM');
			const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, ByteBuffer.fromBinary(data).toArrayBuffer());
			return { iv, ciphertext };
		},
	};
}
