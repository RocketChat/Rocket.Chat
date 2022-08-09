export const getNodeIconType = (basename: string, fileType: string, mime: string): { icon: string; type: string; extension?: string } => {
	let icon = 'clip';
	let type = '';

	let extension = basename?.split('.').pop();
	if (extension === basename) {
		extension = '';
	}

	if (fileType === 'directory') {
		icon = 'folder';
		type = 'directory';
	} else if (mime.match(/application\/pdf/)) {
		icon = 'file-pdf';
		type = 'pdf';
	} else if (['application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		icon = 'file-document';
		type = 'document';
	} else if (
		[
			'application/vnd.ms-excel',
			'application/vnd.oasis.opendocument.spreadsheet',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		].includes(mime)
	) {
		icon = 'file-sheets';
		type = 'sheets';
	} else if (['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'].includes(mime)) {
		icon = 'file-sheets';
		type = 'ppt';
	}
	return { icon, type, extension };
};
