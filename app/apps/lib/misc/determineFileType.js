import fileType from 'file-type';

import { mime as MIME } from '../../../utils/lib/mimeTypes';

export function determineFileType(buffer, details) {
	const mime = MIME.lookup(details.name);

	if (mime) {
		return Array.isArray(mime) ? mime[0] : mime;
	}

	const detectedType = fileType(buffer);

	if (detectedType) {
		return detectedType.mime;
	}

	return 'application/octet-stream';
}
