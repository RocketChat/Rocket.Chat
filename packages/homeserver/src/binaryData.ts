export function toBinaryData(
	value: string | Uint8Array | ArrayBuffer | ArrayBufferView,
): Uint8Array {
	if (typeof value === 'string') {
		return new TextEncoder().encode(value);
	}

	if (value instanceof Uint8Array) {
		return value;
	}

	if (value instanceof ArrayBuffer) {
		return new Uint8Array(value);
	}

	return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function fromBinaryData(
	value: string | Uint8Array | ArrayBuffer,
): string {
	if (typeof value === 'string') {
		return value;
	}

	return new TextDecoder().decode(value);
}

export function toUnpaddedBase64(
	value: Uint8Array | Buffer,
	options: {
		urlSafe?: boolean;
	} = { urlSafe: false },
): string {
	const hash = btoa(String.fromCharCode(...value)).replace(/=+$/, '');

	if (!options.urlSafe) return hash;

	return hash.replace(/\+/g, '-').replace(/\//g, '_');
}
