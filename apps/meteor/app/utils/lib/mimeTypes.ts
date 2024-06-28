import mime from 'mime-type/with-db';

mime.types.wav = 'audio/wav';
mime.types.lst = 'text/plain';
mime.define('image/vnd.microsoft.icon', { source: '', extensions: ['ico'] }, mime.dupAppend);
mime.define('image/x-icon', { source: '', extensions: ['ico'] }, mime.dupAppend);
mime.types.ico = 'image/x-icon';

const getExtension = (param: string): string => {
	const extension = mime.extension(param);

	return !extension || typeof extension === 'boolean' ? '' : extension;
};

const getMimeType = (fileName: string): string => {
	const fileMimeType = mime.lookup(fileName);
	return typeof fileMimeType === 'string' ? fileMimeType : 'application/octet-stream';
};

export { mime, getExtension, getMimeType };
