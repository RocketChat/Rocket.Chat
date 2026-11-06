import { Base64 } from '@rocket.chat/base64';

import { isEncryptedUpload, type Upload } from './Upload';
import { getURL } from '../getURL';

// Where a restored upload's content can be loaded from. Encrypted uploads go through the same decrypting service worker
// route as encrypted attachments in messages.
export const getRestoredUploadUrl = (upload: Upload): string | undefined => {
	if (!upload.restored || !upload.url) {
		return undefined;
	}

	if (!isEncryptedUpload(upload)) {
		return getURL(upload.url, { full: true });
	}

	const key = Base64.encode(
		JSON.stringify({
			key: upload.encryptedFile.key,
			iv: upload.encryptedFile.iv,
			name: String.fromCharCode(...new TextEncoder().encode(upload.file.name)),
			type: upload.file.type,
		}),
	);

	return getURL(`/file-decrypt${upload.url}?key=${encodeURIComponent(key)}`, { full: true });
};
