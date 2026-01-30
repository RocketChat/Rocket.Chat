import { fromBuffer } from 'file-type';

import { mime as MIME } from '../../../app/utils/lib/mimeTypes';

export async function determineFileType(buffer: Buffer, name: string): Promise<string> {
	const mime = MIME.lookup(name);

	if (mime) {
		return Array.isArray(mime) ? mime[0] : mime;
	}

	const detectedType = await fromBuffer(buffer);

	if (detectedType) {
		return detectedType.mime;
	}

	return 'application/octet-stream';
}
