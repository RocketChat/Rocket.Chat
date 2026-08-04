import type { Keys as IconName } from '@rocket.chat/icons';

// TODO: This function should be simplified, it only needs to return the icon name
export const getNodeIconType = (
	basename: string,
	fileType: string,
	mime?: string,
): { icon: IconName; type: string; extension?: string } => {
	let icon: IconName = 'clip';
	let type = '';

	let extension = basename?.split('.').pop();
	if (extension === basename) {
		extension = '';
	}

	if (fileType === 'directory') {
		icon = 'folder';
		type = 'directory';
	} else if (mime?.match(/application\/pdf/)) {
		icon = 'file-pdf';
		type = 'pdf';
	} else if (mime && ['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		icon = 'file-document';
		type = 'document';
	} else if (
		mime &&
		[
			'application/vnd.ms-excel',
			'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		].includes(mime)
	) {
		icon = 'file-sheets';
		type = 'sheets';
	} else if (mime && ['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		icon = 'file-sheets';
		type = 'ppt';
	}
	return { icon, type, extension };
};
