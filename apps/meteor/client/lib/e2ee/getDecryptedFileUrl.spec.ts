import { Base64 } from '@rocket.chat/base64';

import { getDecryptedFileUrl } from './getDecryptedFileUrl';

const encryption = { key: { kty: 'oct', k: 'secret' }, iv: 'iv' };

it('routes the file through the decrypting service worker', () => {
	expect(
		getDecryptedFileUrl('/file-upload/file-1/photo.png', { encryption }).startsWith('/file-decrypt/file-upload/file-1/photo.png?key='),
	).toBe(true);
});

it('carries what the service worker needs to decrypt and serve the file', () => {
	const url = getDecryptedFileUrl('/file-upload/file-1/photo.png', { encryption, name: 'photo.png', type: 'image/png' });

	expect(JSON.parse(atob(new URL(url, 'https://host').searchParams.get('key') ?? ''))).toEqual({
		...encryption,
		name: 'photo.png',
		type: 'image/png',
	});
});

it('encodes non-ASCII names as UTF-8 bytes, as message attachments always have', () => {
	const name = 'fotografía 写真.png';
	const url = getDecryptedFileUrl('/file-upload/file-1/x.png', { encryption, name, type: 'image/png' });

	expect(new URL(url, 'https://host').searchParams.get('key')).toBe(
		Base64.encode(JSON.stringify({ ...encryption, name: String.fromCharCode(...new TextEncoder().encode(name)), type: 'image/png' })),
	);
});
