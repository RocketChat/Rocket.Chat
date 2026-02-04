import mime from 'mime-type/with-db';

mime.types.wav = 'audio/wav';
mime.types.lst = 'text/plain';
mime.define('image/vnd.microsoft.icon', { source: '', extensions: ['ico'] }, mime.dupAppend);
mime.define('image/x-icon', { source: '', extensions: ['ico'] }, mime.dupOverwrite);
mime.define('audio/aac', { source: '', extensions: ['aac'] }, mime.dupOverwrite);

const getExtension = (param: string): string => {
	const extension = mime.extension(param);

	return !extension || typeof extension === 'boolean' ? '' : extension;
};

const getMimeTypeFromFileName = (fileName: string): string => {
	const fileMimeType = mime.lookup(fileName);
	return typeof fileMimeType === 'string' ? fileMimeType : 'application/octet-stream';
};

const getMimeType = (mimetype: string, fileName: string): string => {
	// If the extension from the mimetype is different from the file extension, the file
	// extension may be wrong so use the informed mimetype
	const extension = mime.extension(mimetype);
	if (mimetype !== 'application/octet-stream' && extension && extension !== fileName.split('.').pop()) {
		return mimetype;
	}

	return getMimeTypeFromFileName(fileName);
};

export { mime, getExtension, getMimeType, getMimeTypeFromFileName };
