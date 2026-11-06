import { isEncryptedUpload, type Upload } from './Upload';
import { getDecryptedFileUrl } from '../e2ee/getDecryptedFileUrl';
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

	return getURL(
		getDecryptedFileUrl(upload.url, {
			encryption: { key: upload.encryptedFile.key, iv: upload.encryptedFile.iv },
			name: upload.file.name,
			type: upload.file.type,
		}),
		{ full: true },
	);
};
