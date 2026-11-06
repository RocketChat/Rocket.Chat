import { Base64 } from '@rocket.chat/base64';

type DecryptedFileParams = {
	encryption: { key: JsonWebKey; iv: string };
	name?: string;
	type?: string;
};

// The url of an encrypted file as the decrypting service worker (public/enc.js) serves it, decrypted.
export const getDecryptedFileUrl = (path: string, { encryption, name, type }: DecryptedFileParams): string => {
	const key = Base64.encode(
		JSON.stringify({
			...encryption,
			name: name && String.fromCharCode(...new TextEncoder().encode(name)),
			type,
		}),
	);

	return `/file-decrypt${path}?key=${encodeURIComponent(key)}`;
};
