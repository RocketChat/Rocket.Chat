import type { Upload } from './Upload';
import { getRestoredUploadUrl } from './getRestoredUploadUrl';

jest.mock('../getURL', () => ({
	getURL: (path: string) => `https://host/chat${path}`,
}));

const file = new File([], 'photo.png', { type: 'image/png' });

it('returns nothing for an upload that was not restored', () => {
	expect(getRestoredUploadUrl({ id: 'file-1', file, url: '/file-upload/file-1/photo.png', percentage: 100 })).toBeUndefined();
});

it('resolves a restored upload against the workspace url', () => {
	expect(getRestoredUploadUrl({ id: 'file-1', file, url: '/file-upload/file-1/photo.png', percentage: 100, restored: true })).toBe(
		'https://host/chat/file-upload/file-1/photo.png',
	);
});

it('routes a restored encrypted upload through the decrypting service worker', () => {
	const upload: Upload = {
		id: 'file-1',
		file,
		url: '/file-upload/file-1/photo.png',
		percentage: 100,
		restored: true,
		encryptedFile: { file, key: { kty: 'oct', k: 'secret' }, iv: 'iv', type: 'image/png', hash: 'hash' },
		metadataForEncryption: {},
	};

	const url = new URL(getRestoredUploadUrl(upload) ?? '');

	expect(url.pathname).toBe('/chat/file-decrypt/file-upload/file-1/photo.png');
	expect(JSON.parse(atob(url.searchParams.get('key') ?? ''))).toEqual({
		key: { kty: 'oct', k: 'secret' },
		iv: 'iv',
		name: 'photo.png',
		type: 'image/png',
	});
});
