import { fileTypeFromBuffer } from 'file-type';

import { mime as MIME } from '../../../app/utils/lib/mimeTypes';

export async function determineFileType(buffer, name) {
	const mime = MIME.lookup(name);

	if (mime) {
		return Array.isArray(mime) ? mime[0] : mime;
	}

	const detectedType = await fileTypeFromBuffer(buffer);

	if (detectedType) {
		return detectedType.mime;
	}

	return 'application/octet-stream';
}
