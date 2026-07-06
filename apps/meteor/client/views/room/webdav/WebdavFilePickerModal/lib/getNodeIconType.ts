import type { Keys as IconName } from '@rocket.chat/icons';

export const getNodeIconType = (_basename: string, fileType: string, mime?: string): IconName => {
	if (fileType === 'directory') {
		return 'folder';
	}

	if (mime?.match(/application\/pdf/)) {
		return 'file-pdf';
	}

	if (mime && ['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		return 'file-document';
	}

	if (
		mime &&
		[
			'application/vnd.ms-excel',
			'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		].includes(mime)
	) {
		return 'file-sheets';
	}

	if (mime && ['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		return 'file-sheets';
	}

	return 'clip';
};
